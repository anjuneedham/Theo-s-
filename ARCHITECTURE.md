# Architecture

## 1. Overview

```
┌──────────────────────────── Next.js 16 (App Router, TypeScript, Tailwind v4) ─────────────────────────────┐
│                                                                                                            │
│  Customer web app / PWA            Partner dashboard         Admin dashboard          Driver app           │
│  src/app/(site)/*                  src/app/partner/*         src/app/admin/*          src/app/driver       │
│        │   (server components render directly from services; client components call the REST API)        │
│        ▼                                                                                                   │
│  REST API  /api/v1/*  ── route() wrapper: JSON errors, zod validation, rate limit, same-origin check       │
│        │                                                                                                   │
│        ▼                                                                                                   │
│  Services  src/lib/services/*  ── ALL business rules + authorization (orders, catalog, partner, admin,    │
│        │                          drivers, customers, applications)                                        │
│        ├── Pricing engine  src/lib/pricing.ts        (pure, unit-tested)                                   │
│        ├── Status machine  src/lib/order-status.ts   (pure, unit-tested)                                   │
│        ├── Zones / hours   src/lib/zones.ts, hours.ts (pure, unit-tested)                                  │
│        ├── Payments        src/lib/payments/*        (provider interface)                                  │
│        └── Notifications   src/lib/notifications/*   (channel interface, every attempt logged)             │
│        ▼                                                                                                   │
│  Table gateway  src/lib/db  (Db interface: list/get/findOne/count/insert/update/updateIf/remove)           │
│        ├── local.ts     JSON file store (.data/db.json) — development & demos                              │
│        └── supabase.ts  Supabase/PostgreSQL via service-role key — production                              │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                    Supabase: PostgreSQL (+RLS) · Auth · Storage (media bucket)
```

### Why a table gateway?

The services only depend on a nine-method `Db` interface (`src/lib/db/types.ts`). The **same** business logic runs against:

- **Local mode** (`DATA_BACKEND=local`, the default when Supabase env vars are missing). A JSON file is seeded automatically, so the whole product works on a laptop with zero setup and the test suite runs without a database.
- **Supabase mode** (the default when `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are set). Uses the schema in `supabase/migrations`.

Row types (`src/lib/types.ts`) use the exact PostgreSQL column names, so there is no mapping layer. Joins and aggregates are done in the services, which is fine at launch scale. `restaurant_daily_sales` (a SQL view) and indexes are in place for when reports need to move into SQL.

`updateIf` provides compare-and-set semantics. It is used for:
- order status transitions (optimistic concurrency: two staff clicking at once can't double-apply);
- drivers accepting a job (two drivers can't both win).

## 2. Multi-restaurant data model

Every restaurant-owned table carries `restaurant_id`: menus, categories, items, modifier groups, modifiers, hours, zones, promotions, orders, order items, deliveries, payouts, reviews and events. Theo's is simply the row with `is_anchor = true` (a unique partial index allows only one) and slug `theos` (`NEXT_PUBLIC_ANCHOR_RESTAURANT_SLUG`).

Geographic expansion uses `regions` (e.g. Kingston & St. Andrew, St. Catherine, St. James, St. Ann). Each region has a currency and timezone, restaurants belong to a region, and drivers work in a region. Nothing assumes a single city. Delivery zones are defined per restaurant by **area names** and/or **radius**.

See DATABASE_SCHEMA.md for the full schema.

## 3. Money & revenue split

All money is stored in integer cents; rates are in basis points. `computeTotals()` in `src/lib/pricing.ts` produces:

| Field | Meaning |
|---|---|
| `subtotal_cents` | Sum of line totals (base price + modifiers) × quantity |
| `discount_cents` | Food discount + delivery waiver from a promotion |
| `delivery_fee_cents` | Zone fee (delivery only) |
| `service_fee_cents` | Platform fee = clamp(subtotal × rate, min, max); waived for the anchor unless `service_fee_on_anchor` |
| `tax_cents` | GCT, either included (reporting only) or added |
| `tip_cents` | 100% to the driver |
| `commission_cents` | (subtotal − restaurant-funded food discount) × commission rate |
| `restaurant_payout_cents` | subtotal − restaurant-funded discounts − commission (+ exclusive tax) |
| `delivery_revenue_cents` | delivery fee − driver payout |
| `platform_revenue_cents` | commission + service fee − platform-funded discounts + delivery revenue |

**Invariant (unit-tested):** `total = restaurant payout + platform revenue + driver payout + tip`.

Commission precedence: restaurant override → subscription plan → platform default. The split is **frozen on the order row** at checkout, so later rate changes never rewrite history.

Settlement (`generatePayouts`): groups delivered, unsettled orders per restaurant.
- Money the platform collected (online payments, or cash collected by platform drivers) is owed to the restaurant.
- Money the restaurant collected itself (cash or card on pickup) means the restaurant owes the platform its share.
- A negative payout is shown as "due to platform".

## 4. Order lifecycle

```
pending → confirmed → preparing → ready ─┬─(pickup)────────────→ delivered ("Picked up")
   │          │           │          │   └─(delivery, driver)→ out_for_delivery → delivered
   └──────────┴───────────┴──────────┴──→ cancelled
```

`allowedTransitions(from, fulfillment, actor)` enforces who may do what:

| Actor | Allowed |
|---|---|
| Restaurant | Accept, prepare, mark ready, complete pickups, cancel before handover. **Cannot** mark delivery orders delivered |
| Driver (assigned only) | out_for_delivery, delivered |
| Customer / guest (via tracking token) | Cancel while pending only |
| Admin | Any valid transition |

Online-payment orders can't be confirmed until paid, except by an admin.

Side effects happen in one place (`updateOrderStatus`):
- a status history row is written;
- the delivery row is kept in sync;
- an offline payment is marked paid on handover;
- pending payments are cancelled when the order is cancelled;
- a paid online order that is cancelled is flagged for refund;
- notifications are sent.

## 5. Payments

`src/lib/payments/types.ts` defines `PaymentProvider { createPayment, parseWebhook, refund }`.

| Provider | Status |
|---|---|
| `offline` (cash / card on delivery) | **Built.** Payment stays `pending` until staff confirm handover. It is never reported as paid in advance |
| `stripe` (hosted Checkout) | **Built, needs credentials.** Reference implementation with a signed webhook (`/api/v1/payments/stripe/webhook`) and refunds. Note: Stripe doesn't onboard Jamaica-registered merchants directly |
| `wipay`, `powertranz` | **Stubs.** They throw `PaymentNotConfiguredError` and deliberately are not written against guessed APIs. Implement from the provider's spec during merchant onboarding |

Checkout only offers `online` when `onlineProvider()` returns a configured provider. Placing an online order returns a `redirect_url`; the webhook, after signature verification, updates the payment and order.

## 6. Notifications

`dispatch()` sends on each requested channel and **records every attempt** in `notifications` with status `sent`, `failed` or `skipped` ("provider not configured").

| Channel | Implementation | Needs |
|---|---|---|
| In-app | Stored for signed-in users (Account → Notifications) | — |
| Email | Resend REST API | `RESEND_API_KEY`, `EMAIL_FROM` |
| SMS | Twilio REST API | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_SMS_FROM` |
| WhatsApp | Twilio WhatsApp | `TWILIO_WHATSAPP_FROM` (approved sender + Meta templates) |
| Push | **Planned** — VAPID keys + `web-push` + subscription storage | — |

Order events use templates `order_pending … order_cancelled`. SMS and WhatsApp are limited to the key milestones to control cost.

## 7. Authentication & authorization

- **Supabase mode:** Supabase Auth (email + password) through `@supabase/ssr` cookies. The `handle_new_user` trigger creates `profiles`. `src/proxy.ts` refreshes the session.
- **Local mode:** scrypt-hashed passwords (in `local_credentials`, never selected with profiles) and an HMAC-signed, httpOnly, SameSite=Lax session cookie. `SESSION_SECRET` is required in production.
- **Authorization lives in the services** (`requireUser`, `requireRestaurantAccess`, `actorFor(order)`). The proxy only fast-redirects signed-out users away from dashboards; pages and API routes do the authoritative checks.
- **Restaurant permissions** come from `restaurant_users` (owner, manager or staff). Staff can only toggle item availability.
- **Drivers** only see a customer's name, phone and address after accepting the job.

## 8. Security checklist

| Control | Where |
|---|---|
| Input validation | zod schemas (`src/lib/validation.ts`) on every write endpoint |
| Server-side pricing | Client prices are never trusted (`prepare()` in the orders service) |
| RLS on every table | `supabase/migrations/…_initial_schema.sql`, verified by `supabase/tests/rls_smoke_test.sql` |
| Role-escalation guard | `prevent_role_escalation` trigger |
| Rate limiting | Per IP on login, signup, orders, quote, contact, reviews, applications and events. In-memory; swap for Redis/Upstash when running more than one instance |
| CSRF | SameSite cookies + Origin/Host check on non-GET API requests |
| Security headers | `next.config.ts`: nosniff, frame DENY, referrer policy, permissions policy |
| Uploads | Type sniffed from bytes (JPEG/PNG/WebP), 5 MB max, stored under `restaurants/<id>/` |
| Webhooks | Signature and timestamp verified before use |
| Secrets | Env vars only; the service-role key is server-only (`import "server-only"`) |
| JSON-LD injection | `<` escaped in structured data |
| Private data | Order detail strips internal revenue fields for customers; tracking token required for guests; admin-only analytics and messages |

## 9. SEO

- Per-page metadata and canonical URLs.
- Open Graph image (`src/app/opengraph-image.tsx`).
- `sitemap.xml` includes partner restaurants; `robots.txt` blocks private areas.
- JSON-LD: `Restaurant` (with opening hours, geo, order action), `Menu` (every section and item with offers), `FAQPage`, `Event`.

## 10. PWA and native apps

- `manifest.webmanifest`, icons, and a conservative service worker (`public/sw.js`) that caches only static assets and shows an offline page. It never caches API responses or orders.
- **Native apps:** the REST API under `/api/v1` is the contract. It covers restaurants, menus, quote, orders, tracking, reorder, account, favourites, addresses, reviews and driver jobs. A React Native/Expo app can reuse it directly.
  - Auth in Supabase mode is standard Supabase Auth, usable from `@supabase/supabase-js` on mobile.
  - The alternative is to wrap the PWA with Capacitor for store distribution. See ROADMAP.md.

## 11. Directory map

```
src/
  app/(site)/…          customer website & ordering (shared header/footer/tab bar)
  app/partner/[rid]/…   restaurant dashboard
  app/admin/…           platform admin
  app/driver/           driver app
  app/api/v1/…          REST API
  components/{ui,site,menu,cart,checkout,orders,account,dashboard}
  lib/
    db/                 gateway, local + supabase adapters, seed
    services/           business logic
    payments/           provider interface + adapters
    notifications/      channels + dispatcher
    auth/               sessions, passwords, guards
    pricing.ts order-status.ts zones.ts hours.ts money.ts validation.ts
supabase/
  migrations/           schema, RLS, triggers, storage policies
  seed.sql              Theo's + configuration (generated)
  seed_demo.sql         fictional partner restaurants (generated)
  tests/                stubs + RLS smoke test for plain PostgreSQL
tests/unit/             vitest: pricing, status machine, zones/hours, full order flow
tests/e2e/              Playwright: responsive crawl + checkout flow
```
