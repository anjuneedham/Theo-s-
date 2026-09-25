# Database Schema

Source of truth: `supabase/migrations/20260925000000_initial_schema.sql` (PostgreSQL 15+/Supabase). TypeScript mirror: `src/lib/types.ts`.

Conventions:
- `uuid` primary keys (`gen_random_uuid()`); `timestamptz` timestamps.
- Money is stored as integer **cents** (`*_cents`); rates as **basis points** (`*_bps`, 1500 = 15%).
- Status fields are `text` with `CHECK` constraints, which are easier to evolve than enums.
- Every restaurant-owned row carries `restaurant_id` (the multi-tenant key).

## Entity overview

```
regions ──< restaurants >── subscription_plans
               │  ├──< restaurant_users >── profiles (1:1 auth.users)
               │  ├──< restaurant_category_assignments >── restaurant_categories
               │  ├──< operating_hours
               │  ├──< menu_categories ──< menu_items ──< menu_item_modifier_groups ──< menu_item_modifiers
               │  ├──< delivery_zones
               │  ├──< promotions (restaurant_id NULL = platform-wide)
               │  ├──< placements (featured / sponsored, paid)
               │  ├──< restaurant_events
               │  ├──< reviews
               │  ├──< payouts ──< orders.payout_id
               │  └──< orders ──< order_items
               │           ├──< order_status_history
               │           ├──< payments
               │           ├── deliveries >── drivers ── profiles
               │           └──< notifications
profiles ──< delivery_addresses, favorites, notifications
platform_settings (single row), contact_messages, analytics_events
```

The prompt's suggested `users` and `customers` tables map to **`profiles`**: one row per Supabase Auth user, with a platform `role`. Guest customers are captured on the order itself (`contact_*`). This avoids a duplicate customer record that could drift from the auth user.

## Tables

### Reference & configuration
| Table | Key columns |
|---|---|
| `regions` | `slug` unique, `name`, `country`, `currency`, `timezone`, `is_active`, `sort_order` |
| `restaurant_categories` | cuisine taxonomy: `slug` unique, `name`, `sort_order` |
| `subscription_plans` | `slug`, `name`, `monthly_fee_cents`, `commission_rate_bps`, `features text[]`, `is_active` |
| `platform_settings` | single row `id='default'`: `default_commission_bps`, `service_fee_bps`, `service_fee_min_cents`, `service_fee_max_cents`, `service_fee_on_anchor`, `tax_rate_bps`, `tax_inclusive`, `driver_base_payout_cents`, `driver_fee_share_bps`, `payment_methods text[]`, `allow_guest_checkout`, `support_email`, `support_phone` |

### Users
| Table | Key columns |
|---|---|
| `profiles` | `id` → `auth.users.id`, `email`, `full_name`, `phone`, `role` (customer / restaurant / driver / admin), `marketing_opt_in` |
| `restaurant_users` | `restaurant_id`, `user_id`, `role` (owner / manager / staff), unique(restaurant, user) |
| `drivers` | `user_id` unique, `full_name`, `phone`, `vehicle_type`, `vehicle_plate`, `region_id`, `status` (offline / available / busy), `is_approved` |
| `delivery_addresses` | `user_id`, `label`, `line1`, `line2`, `area`, `city`, `parish`, `instructions`, `latitude`, `longitude`, `is_default` |

### Restaurants & menus
| Table | Key columns |
|---|---|
| `restaurants` | `slug` unique, `name`, `tagline`, `description`, `region_id`, contact fields, address, `latitude/longitude`, `timezone`, `currency`, `logo_url`, `cover_url`, `status` (pending / active / suspended / rejected), `is_anchor` (unique when true), `is_featured`, `plan_id`, `commission_rate_bps` (override, nullable), `accepts_delivery`, `accepts_pickup`, `min_order_cents`, `prep_time_minutes`, `rating_avg`, `rating_count`, socials |
| `restaurant_category_assignments` | `restaurant_id`, `category_id` (unique pair) |
| `operating_hours` | `restaurant_id`, `day_of_week` 0–6, `opens_at`, `closes_at` (HH:MM; closing ≤ opening means past midnight), `is_closed`; unique(restaurant, day) |
| `menu_categories` | `restaurant_id`, `name`, `slug` (unique per restaurant), `sort_order`, `is_active`, `available_from/until` (serving window) |
| `menu_items` | `restaurant_id`, `category_id`, `name`, `description`, `price_cents`, `image_url`, `is_available`, `is_featured`, `dietary_tags text[]`, `spice_level` 0–3, `sort_order` |
| `menu_item_modifier_groups` | `menu_item_id`, `name`, `min_select`, `max_select`, `sort_order` |
| `menu_item_modifiers` | `group_id`, `name`, `price_delta_cents`, `is_available`, `is_default`, `sort_order` |

### Delivery
| Table | Key columns |
|---|---|
| `delivery_zones` | `restaurant_id`, `name`, `fee_cents`, `min_minutes`, `max_minutes`, `areas text[]`, `radius_km`, `min_order_cents`, `is_active`, `sort_order` |
| `deliveries` | `order_id` unique, `restaurant_id`, `driver_id`, `status` (unassigned / assigned / picked_up / delivered / cancelled), `driver_payout_cents`, `tip_cents`, timestamps |

### Orders & payments
| Table | Key columns |
|---|---|
| `orders` | `order_number` unique, `tracking_token` unique, `restaurant_id`, `customer_id` (null = guest), `contact_name/email/phone`, `fulfillment_type`, `status`, `delivery_address jsonb` (snapshot), `delivery_zone_id`, `notes`, `scheduled_for`, `currency`, totals (`subtotal/discount/delivery_fee/service_fee/tax/tip/total_cents`), **frozen split** (`commission_rate_bps`, `commission_cents`, `restaurant_payout_cents`, `platform_revenue_cents`, `delivery_revenue_cents`), `promotion_id`, `payment_method`, `payment_status`, `payout_id`, ETAs, `cancel_reason`, `idempotency_key` unique |
| `order_items` | `order_id`, `menu_item_id` (nullable if the item is later deleted), snapshot `name`, `unit_price_cents`, `quantity` 1–50, `modifiers jsonb`, `special_instructions`, `line_total_cents` |
| `order_status_history` | `order_id`, `status`, `note`, `actor_id`, `created_at` |
| `payments` | `order_id`, `provider`, `method`, `amount_cents`, `status` (pending / requires_action / authorized / paid / failed / cancelled / refunded / partially_refunded), `provider_reference` (unique per provider), `refunded_cents`, `failure_reason` |
| `payouts` | `restaurant_id`, `period_start/end`, `order_count`, `gross_sales_cents`, `commission_cents`, `adjustments_cents`, `amount_cents` (negative = due from restaurant), `status`, `reference`, `paid_at` |

### Growth & engagement
| Table | Key columns |
|---|---|
| `promotions` | `restaurant_id` (null = platform), `code` (unique per restaurant), `title`, `type` (percent / fixed / free_delivery), `value`, `min_subtotal_cents`, `funded_by`, `starts_at/ends_at`, `usage_limit`, `used_count`, `is_active` |
| `placements` | `restaurant_id`, `type` (featured / sponsored), `region_id`, `starts_at/ends_at`, `fee_cents`, `status` |
| `reviews` | `restaurant_id`, `order_id` unique, `user_id`, `author_name`, `rating` 1–5, `comment`, `reply`, `is_published` |
| `favorites` | `user_id` + exactly one of `restaurant_id` / `menu_item_id` (partial unique indexes) |
| `notifications` | `user_id`, `order_id`, `channel`, `recipient`, `template`, `title`, `body`, `status` (queued / sent / failed / skipped), `error`, `read_at` |
| `restaurant_events` | `restaurant_id`, `title`, `description`, `starts_at`, `ends_at`, `image_url`, `cover_charge_cents`, `is_published` |
| `contact_messages` | `name`, `email`, `phone`, `topic`, `message`, `status` |
| `analytics_events` | `name`, `restaurant_id`, `user_id`, `session_id`, `path`, `properties jsonb` |

### Local-mode only
`local_credentials` (id, email, password_hash) exists only in the JSON dev store. Supabase Auth owns passwords in production.

## Indexes (highlights)
- `orders (restaurant_id, created_at desc)`, `orders (customer_id, created_at desc)`, partial index on active statuses, partial "unsettled" index for payouts.
- `menu_items (restaurant_id, category_id, sort_order)`, partial featured index.
- `deliveries (status, created_at)`, `deliveries (driver_id, status)`.
- `analytics_events (created_at desc, name)`, `notifications (user_id, created_at desc)`.
- Uniques: restaurant slug, order number, tracking token, idempotency key, one anchor restaurant, one review per order, payment provider reference.

## Functions, triggers, views
- `handle_new_user()` — creates a profile when an auth user signs up.
- `prevent_role_escalation()` — only admins (or the service role) can change `profiles.role`.
- `is_admin()`, `is_restaurant_member(rid)`, `is_assigned_driver(order_id)`, `can_view_order(order_id)` — `SECURITY DEFINER` helpers used by RLS.
- `accept_delivery(delivery_id)` — atomic job acceptance for direct (native app) clients.
- `set_updated_at()` on `orders` and `payments`.
- View `restaurant_daily_sales` (`security_invoker`): daily orders, gross, food sales, commission, payouts, platform and delivery revenue.

## Row Level Security (summary)
| Data | Policy |
|---|---|
| Catalogue (active restaurants, menus, hours, zones, events, categories, regions, plans, settings) | Public read |
| Menus, hours, zones, events, promotions | Restaurant staff write |
| Profiles, addresses, favourites, notifications, driver profile | Owner only (admins can read) |
| Orders, items, history, payments | Readable by the customer, restaurant staff, the **assigned** driver and admins. **No direct inserts** — orders are created by the server so prices can't be tampered with |
| Promo codes | Hidden from the public |
| Contact messages, analytics | Admin read only |
| Storage (`media` bucket) | Public read; uploads only under `restaurants/<id>/` by that restaurant's staff |

Verified by `supabase/tests/rls_smoke_test.sql` (see SETUP.md §Testing the schema).

## Seeds
- `supabase/seed.sql` — platform settings, regions, cuisine categories, plans, and Theo's (restaurant, hours, full sample menu with modifiers, zones, promotions, events relative to seed time).
- `supabase/seed_demo.sql` — **fictional** partner restaurants for demos. Do not load in production.
- Both are generated from `src/lib/db/seed.ts` with `npm run db:seed-sql`, so local and Supabase data match.
