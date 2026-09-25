# Theo's Restaurant & Lounge — Website, Ordering & Delivery Network

A production-oriented foundation for **Theo's Restaurant & Lounge**. Theo's is the anchor restaurant, and the codebase is built as a **multi-restaurant ordering and delivery platform** from day one.

| Surface | Path | What it does |
|---|---|---|
| Restaurant website | `/`, `/menu`, `/lounge`, `/events`, `/specials`, `/about`, `/contact`, `/faq`, `/delivery` | Premium, mobile-first marketing site with local SEO |
| Ordering app (web / PWA) | `/order`, `/cart`, `/checkout`, `/orders/[id]`, `/account` | App-like ordering: customise, pickup/delivery, live quote, tracking, reorder |
| Delivery network | `/restaurants`, `/restaurants/[slug]`, `/network`, `/partners`, `/drive` | Marketplace of partner restaurants by region and cuisine |
| Partner dashboard | `/partner/[restaurantId]` | Orders, menu editor, profile, hours, delivery zones, promotions, payouts, reviews |
| Admin dashboard | `/admin` | Platform metrics, restaurants and applications, commission, fees, dispatch, payouts, analytics, users |
| Driver app | `/driver` | Go online, accept jobs, pick up, deliver, earnings |
| REST API | `/api/v1/*` | Shared by the web app and future native apps |

**Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Supabase (PostgreSQL + Auth + Storage), zod, zustand, Vitest, Playwright.

## Quick start

```bash
npm install
npm run dev     # http://localhost:3000 — works immediately with local sample data
```

Sign in with the one-click demo accounts on `/login` (admin, Theo's staff, partner, driver, customer). Details are in [SETUP.md](SETUP.md).

## Documentation

- [PRODUCT_REQUIREMENTS.md](PRODUCT_REQUIREMENTS.md) — research summary, business model (labelled assumptions), requirements and status, content still needed
- [ARCHITECTURE.md](ARCHITECTURE.md) — system design, revenue-split engine, order lifecycle, payments, notifications, security
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) — tables, relationships, indexes, RLS
- [SETUP.md](SETUP.md) — local setup, Supabase, environment variables, credentials checklist, deployment
- [ROADMAP.md](ROADMAP.md) — phase-by-phase progress and next steps
- [CHANGELOG.md](CHANGELOG.md)

## What works today

- The full customer journey:
  - Browse the menu, customise items (required sides, add-ons, heat level), add to cart.
  - Choose pickup or delivery; pick your area and see the fee and ETA.
  - Check out as a guest or a member, with promo codes, tips and scheduling.
  - Place the order, then track it (the page polls for updates), cancel while pending, reorder, and review after delivery.
- Restaurants accept and advance orders, edit the menu (including modifier groups and photo upload), hours, zones and promotions, and see earnings and payouts.
- Drivers accept jobs, pick up and deliver. Cash-on-delivery is marked paid only at handover.
- Admins see platform metrics and revenue splits; approve partners; set commission, plans, fees and tax; assign drivers; run settlements; manage users; view analytics.
- The pricing engine computes restaurant payout, platform revenue, delivery revenue and driver pay for every order, and freezes the split on the order.

## What needs credentials or content

These are the things **not** yet live. Details are in SETUP.md §5.

- **Supabase project.** Until connected, data lives in a local JSON file (development and demos only). The schema is validated on PostgreSQL, but the app hasn't yet been run against a live Supabase project.
- **Online card payments.** Only cash and card-on-delivery are offered until a provider is connected. A Stripe reference adapter is included; Caribbean acquirers (WiPay, PowerTranz) are stubbed.
- **Email, SMS and WhatsApp.** Built on Resend and Twilio. Until keys are set, every attempt is logged as `skipped`. Push notifications are not implemented.
- **Theo's real content.** Address, phone, hours, menu, prices and photos are placeholders. The partner restaurants are fictional demo data.

## Verification

```bash
npm run typecheck && npm run lint && npm test && npm run test:e2e && npm run build
```

| Check | Result at the last run |
|---|---|
| Vitest (pricing invariants, status machine, zones/hours, full order flow including driver, payouts, promo codes, idempotency, access control) | 35 tests pass |
| Playwright (22 pages × mobile/tablet/desktop — status, console errors, horizontal overflow; guest order → restaurant accepts → customer sees update) | 74 pass, 4 skipped by design |
| Production build | Succeeds |
| SQL migration + seeds + RLS smoke test on PostgreSQL 16 | Pass |
