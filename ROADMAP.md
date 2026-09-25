# Roadmap & Implementation Progress

Status key: ✅ built and verified (tests or browser crawl) · 🟡 built, needs credentials or a live-service check · ⬜ not started.

## Phase 1 — Theo's marketing website ✅
- ✅ All 12 required pages, plus Restaurants, Network, Partners, Drive, 404 and Offline
- ✅ Every homepage section from the brief
- ✅ Responsive at 390 / 820 / 1440 px with no horizontal overflow or console errors (automated crawl)
- ✅ SEO: metadata, canonical URLs, Open Graph image, sitemap, robots, JSON-LD (Restaurant, Menu, FAQ, Events)
- ⬜ Real photography (current images are illustrated placeholders generated in code)
- ⬜ Real address, contact details, hours and socials from Theo's (see PRODUCT_REQUIREMENTS §6)

## Phase 2 — Menu system ✅
- ✅ Database-driven categories, items and modifier groups with min/max rules
- ✅ Admin/partner menu editor, including photo upload, sold-out toggle and ordering
- ✅ Serving windows per category (e.g. breakfast)
- ⬜ Bulk menu import (CSV)
- ⬜ Scheduled price changes and happy-hour pricing

## Phase 3 — Ordering ✅
- ✅ Cart (persisted), customiser, checkout, live server-side quote, promo codes, tips, scheduling
- ✅ Server-side pricing, idempotent order placement, guest tracking token
- ✅ Status machine with role-based permissions and optimistic concurrency
- 🟡 Online payments: Stripe reference adapter built; a Caribbean acquirer needs implementing and credentials
- ⬜ Order-ready printing / kitchen display

## Phase 4 — Delivery ✅
- ✅ Configurable zones per restaurant (areas and/or radius, fee, ETA, minimum order)
- ✅ Saved addresses, GPS "Locate me", driver app, admin dispatch, atomic job acceptance
- ⬜ Live driver GPS on the tracking page (Supabase Realtime + a location table)
- ⬜ Address autocomplete / geocoding (Google Places)
- ⬜ Automatic dispatch (nearest available driver)

## Phase 5 — Customer accounts ✅
- ✅ Profile, addresses, order history, reorder, favourites, "your usual", reviews, in-app notifications
- ⬜ Loyalty / rewards points
- ⬜ Password reset UI (available through Supabase Auth; needs a page)
- ⬜ Account deletion self-service (currently by request)

## Phase 6 — Admin dashboard ✅
- ✅ Metrics from the brief; restaurants, customers, orders, menus, zones, commission, promotions, payouts, analytics, users and settings
- ✅ Integrations status panel
- ⬜ Events editor UI (events currently come from seed/DB)
- ⬜ Audit log of admin actions
- ⬜ CSV exports

## Phase 7 — Partner restaurant system ✅
- ✅ Application → approval → dashboard; menu, profile, hours, zones, promotions, payouts, reviews
- ⬜ Staff invitations UI (currently via SQL; see SETUP.md)
- ⬜ Pause-orders toggle ("busy mode") and prep-time override

## Phase 8 — Marketplace / network ✅
- ✅ Browse, filter by region and cuisine, search, restaurant pages, sponsored/featured placements, favourites
- ⬜ Replace fictional demo partners with real partners
- ⬜ Multi-restaurant cart (currently one restaurant per order, which is intentional for launch)
- ⬜ Subscription billing automation for partner plans

## Phase 9 — Analytics ✅
- ✅ First-party events, funnel, AOV, repeat rate, cancel rate, delivery and prep times, restaurant performance
- ⬜ Cohort retention, marketing attribution (UTM capture)

## Phase 10 — Production hardening 🟡
- ✅ RLS (with SQL smoke test), zod validation, role guards, rate limiting, CSRF origin check, security headers, upload validation, webhook signature checks
- ✅ Unit + integration tests (35), Playwright e2e specs
- 🟡 Staging run against a live Supabase project
- ⬜ Distributed rate limiting (Upstash/Redis)
- ⬜ Error monitoring (Sentry) and uptime checks
- ⬜ CI pipeline (typecheck, lint, unit, e2e, SQL smoke test on Postgres)
- ⬜ Web push notifications
- ⬜ Legal review of Privacy/Terms; Data Protection Act (Jamaica) compliance review
- ⬜ Accessibility audit with assistive technology

## Recommended next steps (in order)
1. **Content:** replace placeholders with Theo's real address, contacts, hours, menu, prices and photos. All of this is done in the dashboards.
2. **Supabase:** create the project, run the migration and seed, create the admin, and do a full staging pass.
3. **Email + SMS:** connect Resend and Twilio so customers receive order updates.
4. **Payments:** open a merchant account with a Caribbean acquirer and implement its adapter (`src/lib/payments/caribbean.ts`). Launch with cash / card-on-delivery until then.
5. **Launch Theo's direct ordering** (Phases 1–6). Measure the funnel and repeat rate for 4–8 weeks.
6. **CI + monitoring** before onboarding the first partners.
7. **Onboard 2–3 partner restaurants** in Kingston, then expand region by region.
8. **Native apps:** wrap the PWA with Capacitor for app-store presence, or build an Expo app against `/api/v1`.
