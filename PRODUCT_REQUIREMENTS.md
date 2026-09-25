# Product Requirements — Theo's Restaurant & Lounge / Theo's Delivery Network

> Status legend used across the docs: **Built** = implemented and exercised by automated tests or the browser crawl · **Built, needs credentials** = code path exists but needs a third-party account to run for real · **Planned** = not built yet.

## 1. Vision

Theo's is the **anchor restaurant** of a multi-restaurant ordering and delivery platform.

```
THEO'S RESTAURANT → ONLINE ORDERING → THEO'S DELIVERY → DELIVERY NETWORK → MORE RESTAURANTS → MORE AREAS → PLATFORM REVENUE
```

The first launch is deliberately simple: Theo's own website, menu, direct ordering (pickup + delivery), and an admin/partner dashboard to run it. The data model, APIs and fee engine are multi-restaurant from day one, so onboarding partner restaurants and new regions is configuration, not a rewrite.

## 2. Research summary

This summary comes from general industry knowledge of restaurant ordering, delivery marketplaces and their UX patterns. It was **not** a fresh market survey: no live competitor data was collected for this document. Validate the figures below with local operators before relying on them.

### 2.1 What we took from existing products (without copying any design)

| Area | Common pattern | What Theo's does |
|---|---|---|
| Restaurant websites | Menus that are PDFs or images, a hard-to-find "order" link, and third-party ordering that takes a cut | An HTML menu (good for SEO and screen readers), "Order online" in the hero and header, and direct ordering with no service fee |
| Delivery apps | Big food images, horizontal category chips, sticky cart, 2–3 tap add-to-cart | Same app-like interaction on the web: sticky category tabs with scroll-spy, a bottom-sheet item customiser, a sticky cart bar and a mobile tab bar |
| Multi-vendor marketplaces | Filter by area and cuisine; badges for open/closed, ETA, fee and sponsored listings | `/restaurants` has region and cuisine filters, search, open/closed state, ETA, "delivery from" fee, and sponsored/featured placements |
| Partner dashboards | Order queue with accept/reject, "86" (sold-out) toggles, menu editor, payouts | Order board with auto-refresh, one-tap availability toggle, full menu and modifier editor, payouts with a commission breakdown |
| Delivery tracking | Status timeline and ETA, driver contact | Timeline built from the status history, ETA, driver name and call button once the order is out for delivery, and polling every 15 s |
| Checkout | Guest checkout, saved addresses, fees shown before paying | Guest checkout, saved addresses, an area picker (minimal typing), and a live server-side quote so the total shown is the total charged |
| Retention | Reorder, favourites, promo codes, loyalty | One-tap "Order again", favourites, a "your usual" list, promo codes. A loyalty programme is **Planned** |

### 2.2 Business models seen in the market (assumptions — validate locally)

| Revenue lever | Typical range seen internationally | Default in this build (editable) |
|---|---|---|
| Restaurant commission | ~15–30% of food subtotal | 15% default; plan rates 18% / 14% / 10%; Theo's own orders 0% |
| Customer service fee | ~5–15%, often with a min/max | 5%, min J$100, max J$600; **waived** on direct Theo's orders |
| Delivery fee | Flat or distance/zone-based | Per-zone fee set by each restaurant |
| Restaurant subscription | Monthly tiers that trade a fee for a lower commission | Starter J$0, Growth J$15,000, Pro J$35,000 per month |
| Featured / sponsored placement | A fixed fee per period | Admin creates paid placements with dates and a fee |
| Promotions | Funded by the restaurant or the platform | Both supported; the funder is tracked per promotion |

**These are business-model assumptions, not recommendations or forecasts.** No revenue projections are made anywhere in this project. Every rate lives in `platform_settings`, `subscription_plans` or on the restaurant row, and Admin → Fees & settings has a worked example that recalculates live.

### 2.3 Local considerations (Jamaica / Caribbean)

- Cash and card-on-delivery are still expected, so online payment is optional. Stripe does not onboard Jamaica-registered merchants directly, so Caribbean acquirers (WiPay, PowerTranz/First Atlantic Commerce) are the likely production choice. See ARCHITECTURE.md §Payments.
- Street addressing is informal. Customers pick a **community/area** from a list (which sets the zone), then add a street and landmark directions. GPS "Locate me" is optional.
- WhatsApp is the dominant messaging channel. The WhatsApp notification channel is built but needs an approved WhatsApp Business sender.
- GCT is currently modelled as 15% and tax-inclusive. **Confirm with an accountant.**

## 3. Users & roles

| Role | Who | Key capabilities |
|---|---|---|
| Customer (guest or signed in) | Diners | Browse the menu and restaurants, customise items, check out, track orders, reorder, save addresses and favourites, review delivered orders |
| Restaurant (owner / manager / staff) | Theo's and partner staff | Manage orders, the menu (staff can only toggle availability), profile, hours, delivery zones, promotions; view payouts and reviews |
| Driver | Delivery staff | Go online or offline, see jobs (area and payout only), accept, pick up, deliver, see earnings |
| Admin | Platform team | Everything: restaurants and applications, commission and plans, fees, users and roles, drivers and dispatch, payouts, promotions, placements, analytics, messages |

## 4. Functional requirements and status

### Phase 1 — Theo's marketing website — **Built**
Pages: Home, Menu, Order Online, Delivery, About, Lounge, Events, Specials, Contact, FAQ, Privacy (draft), Terms (draft). Also Restaurants, Network, Partners, Drive, 404, Offline.
The homepage has every section in the brief: hero, imagery, order/menu CTAs, featured dishes, categories, specials, about, lounge/events, delivery, why order direct, reviews, network teaser, location/hours/social and footer.

### Phase 2 — Menu system — **Built**
- Categories and items are database-driven and edited in Partner → Menu. No code changes are needed.
- Items: name, description, price, image, category, availability, featured flag, dietary tags, spice level, sort order.
- Modifier groups with min/max rules (required choices, optional add-ons) and per-option prices, defaults and availability.
- Category serving windows (e.g. Breakfast 07:00–11:30), enforced at checkout.
- Quantity and special instructions per line.

### Phase 3 — Ordering — **Built**
Browse → customise → cart → pickup/delivery → contact details → address → payment method → confirm → confirmation → tracking.
Server-side pricing, promo codes, tips, scheduling for later, idempotent submission, and a guest tracking token. Statuses: PENDING, CONFIRMED, PREPARING, READY, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, with a role-aware state machine.

### Phase 4 — Delivery — **Built**
Configurable zones per restaurant (areas list and/or radius), with fee, ETA and minimum order per zone. Saved addresses, fee and ETA shown before payment, driver app, admin dispatch/assignment, and atomic job acceptance.

### Phase 5 — Customer accounts — **Built**
Profile (name, email, phone, marketing opt-in), saved addresses, order history, favourite restaurants, favourite meals ("your usual"), reviews, in-app notifications. Guest checkout is optional (admin toggle).

### Phase 6 — Admin dashboard — **Built**
Metrics: total and today's orders, gross value, platform revenue, restaurant payouts, Theo's direct revenue, active restaurants, pending applications, active deliveries, customer accounts, top restaurants, top items and recent orders.
Management: restaurants, customers, orders (with a revenue-split detail and refunds), menus and zones (via the partner tools), commission and plans, delivery dispatch, promotions, payouts, analytics, users and roles, and platform settings.

### Phase 7 — Partner restaurant system — **Built**
Application → admin approval → dashboard. The dashboard covers today's orders, revenue, pending and completed counts, popular products, average order value, reviews, 30-day earnings with commission, and payouts.

### Phase 8 — Marketplace/network — **Built (with fictional demo partners)**
Browse, filter by region and cuisine, search, restaurant pages with menus, single-restaurant cart with a switch prompt, favourites and reviews, plus sponsored and featured ordering. Three **fictional** partner restaurants are seeded for local demos only.

### Phase 9 — Analytics — **Built (first-party)**
Tracked events: page views, menu views, product views, add to cart, checkout started and checkout completed (server-side).
Reports: funnel with step conversion, orders, AOV, repeat-customer rate, cancel rate, restaurant performance, average delivery time, on-time rate and prep time.

### Phase 10 — Production hardening — **Partly built**
Built: RLS, role guards, zod validation, rate limiting (single instance), CSRF origin check, security headers, the SQL smoke test, and unit/integration tests.
Remaining: see ROADMAP.md (distributed rate limiting, error monitoring, e2e in CI, push notifications, a payment provider, legal review).

## 5. Non-functional requirements

- **Mobile-first:** 390 px first, then tablet (820 px) and desktop (1440 px). Automated crawl checks for horizontal overflow and console errors.
- **Performance:** server-rendered pages, no client data fetching for menus, inline SVG placeholders (no image network cost), fonts self-hosted via `@fontsource`.
- **Accessibility:** semantic landmarks, skip link, native `<dialog>` modals, labelled controls, visible focus, `prefers-reduced-motion`, and a screen-reader table behind the charts.
- **Security:** see ARCHITECTURE.md §Security.
- **Honesty:** no fake payments, reviews, testimonials or revenue figures. Notification attempts are recorded with their real outcome, including `skipped` when a provider isn't connected.

## 6. Content still needed from Theo's before launch

| Item | Where to change it |
|---|---|
| Street address and exact coordinates (currently only "Kingston" plus placeholder central-Kingston coordinates) | Partner → Restaurant profile |
| Real phone, WhatsApp and email (currently `555` placeholder numbers and a `.example` email) | Partner → Restaurant profile; Admin → Settings |
| Real menu, prices and photos (current menu is realistic **sample** content with illustrated placeholders) | Partner → Menu |
| Real opening hours | Partner → Opening hours |
| Real delivery areas and fees | Partner → Delivery zones |
| Real events | Currently seed data; an events editor is **Planned** (ROADMAP) — edit the `restaurant_events` table until then |
| Social media URLs | Partner → Restaurant profile |
| Legal review of Privacy and Terms | `src/app/(site)/privacy`, `src/app/(site)/terms` |
| Commission, fees and tax rates confirmed by the business and an accountant | Admin → Fees & settings |
