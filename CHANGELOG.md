# Changelog

All notable changes to this project are documented here.

## [0.1.0] — 2026-09-25

First full foundation of the Theo's platform.

### Added
- **Website:** Home, Menu, Order Online, Delivery, About, Lounge, Events, Specials, Contact, FAQ, Privacy (draft), Terms (draft), Restaurants, Network, Partners, Drive, 404 and Offline pages. The design system (tokens, typography, components) has a Jamaican-inspired identity and an illustrated dish-art placeholder system.
- **Menu system:** database-driven categories, items, modifier groups (min/max), dietary tags, spice levels, availability and serving windows; partner menu editor with photo upload.
- **Ordering:** persisted cart, item customiser, checkout with live server-side quotes, promo codes, tips, scheduling, guest checkout, idempotent order placement, tracking page, cancel, reorder, reviews.
- **Delivery:** per-restaurant zones (areas and/or radius), saved addresses, GPS locate, driver app, admin dispatch, atomic job acceptance.
- **Accounts:** profile, addresses, orders, favourites, reviews, notifications.
- **Partner dashboard:** overview metrics, order board, menu, profile, hours, zones, promotions, payouts, reviews; application and approval flow.
- **Admin dashboard:** platform metrics and revenue split, orders (with revenue detail and refunds), restaurants (approval, commission, plans, placements), menus and zones, deliveries and drivers, customers, promotions, payouts and settlement, analytics, messages, users and roles, fees and settings with a worked example and integrations status.
- **Platform core:** pricing and revenue-split engine, role-aware order state machine, table gateway with local and Supabase adapters, payment provider interface (offline, Stripe reference, Caribbean stubs), notification channels (in-app, email, SMS, WhatsApp) with every attempt logged, first-party analytics, rate limiting, CSRF origin check, security headers.
- **Database:** PostgreSQL schema with indexes, RLS on every table, auth triggers, role-escalation guard, reporting view, storage policies; generated seeds; RLS smoke test.
- **SEO & PWA:** metadata, Open Graph image, sitemap, robots, JSON-LD (Restaurant, Menu, FAQ, Event), web manifest, service worker with offline page.
- **Tests:** Vitest unit/integration suite; Playwright responsive and ordering e2e.
- **Docs:** README, PRODUCT_REQUIREMENTS, ARCHITECTURE, DATABASE_SCHEMA, ROADMAP, SETUP.
