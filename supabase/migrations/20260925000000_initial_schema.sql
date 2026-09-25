-- =============================================================================
-- Theo's Delivery Network — initial schema
-- Multi-restaurant from day one: every restaurant-owned row carries restaurant_id.
-- Money is stored as integer minor units (cents). Rates are basis points (1500 = 15%).
-- =============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------- helpers
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ----------------------------------------------------------------- reference data
create table public.regions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  country text not null default 'JM',
  currency text not null default 'JMD',
  timezone text not null default 'America/Jamaica',
  is_active boolean not null default true,
  sort_order int not null default 0
);

create table public.restaurant_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order int not null default 0
);

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  monthly_fee_cents int not null default 0 check (monthly_fee_cents >= 0),
  commission_rate_bps int not null check (commission_rate_bps between 0 and 5000),
  features text[] not null default '{}',
  is_active boolean not null default true,
  sort_order int not null default 0
);

-- Single-row platform configuration. All fees and rates are editable by admins.
create table public.platform_settings (
  id text primary key default 'default' check (id = 'default'),
  platform_name text not null,
  currency text not null default 'JMD',
  default_commission_bps int not null default 1500 check (default_commission_bps between 0 and 5000),
  service_fee_bps int not null default 0 check (service_fee_bps between 0 and 3000),
  service_fee_min_cents int not null default 0,
  service_fee_max_cents int not null default 0,
  service_fee_on_anchor boolean not null default false,
  tax_rate_bps int not null default 0 check (tax_rate_bps between 0 and 5000),
  tax_inclusive boolean not null default true,
  driver_base_payout_cents int not null default 0,
  driver_fee_share_bps int not null default 0 check (driver_fee_share_bps between 0 and 10000),
  payment_methods text[] not null default '{cash}',
  allow_guest_checkout boolean not null default true,
  support_email text not null,
  support_phone text not null,
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------- users
-- One profile per auth.users row. `role` is the platform-level role; restaurant
-- staff permissions come from restaurant_users.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  phone text,
  role text not null default 'customer' check (role in ('customer', 'restaurant', 'driver', 'admin')),
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now()
);
create index profiles_role_idx on public.profiles (role);

-- ----------------------------------------------------------------- restaurants
create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text,
  description text,
  region_id uuid references public.regions (id) on delete set null,
  phone text,
  email text,
  whatsapp text,
  address_line text,
  area text,
  city text,
  parish text,
  country text not null default 'JM',
  latitude double precision,
  longitude double precision,
  timezone text not null default 'America/Jamaica',
  currency text not null default 'JMD',
  logo_url text,
  cover_url text,
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended', 'rejected')),
  is_anchor boolean not null default false,
  is_featured boolean not null default false,
  plan_id uuid references public.subscription_plans (id) on delete set null,
  commission_rate_bps int check (commission_rate_bps between 0 and 5000),
  accepts_delivery boolean not null default true,
  accepts_pickup boolean not null default true,
  min_order_cents int not null default 0 check (min_order_cents >= 0),
  prep_time_minutes int not null default 25 check (prep_time_minutes between 1 and 240),
  rating_avg numeric(2, 1) not null default 0,
  rating_count int not null default 0,
  social_instagram text,
  social_facebook text,
  social_tiktok text,
  created_at timestamptz not null default now()
);
create index restaurants_status_idx on public.restaurants (status);
create index restaurants_region_idx on public.restaurants (region_id);
create unique index restaurants_single_anchor on public.restaurants (is_anchor) where is_anchor;

create table public.restaurant_category_assignments (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  category_id uuid not null references public.restaurant_categories (id) on delete cascade,
  unique (restaurant_id, category_id)
);
create index rca_category_idx on public.restaurant_category_assignments (category_id);

create table public.restaurant_users (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'staff' check (role in ('owner', 'manager', 'staff')),
  created_at timestamptz not null default now(),
  unique (restaurant_id, user_id)
);
create index restaurant_users_user_idx on public.restaurant_users (user_id);

create table public.operating_hours (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  opens_at text not null check (opens_at ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  closes_at text not null check (closes_at ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  is_closed boolean not null default false,
  unique (restaurant_id, day_of_week)
);

-- ----------------------------------------------------------------- menus
create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  available_from text,
  available_until text,
  unique (restaurant_id, slug)
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  category_id uuid not null references public.menu_categories (id) on delete restrict,
  name text not null,
  description text,
  price_cents int not null check (price_cents >= 0),
  image_url text,
  is_available boolean not null default true,
  is_featured boolean not null default false,
  dietary_tags text[] not null default '{}',
  spice_level smallint not null default 0 check (spice_level between 0 and 3),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index menu_items_restaurant_category_idx on public.menu_items (restaurant_id, category_id, sort_order);
create index menu_items_featured_idx on public.menu_items (restaurant_id) where is_featured;

create table public.menu_item_modifier_groups (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  menu_item_id uuid not null references public.menu_items (id) on delete cascade,
  name text not null,
  min_select int not null default 0 check (min_select >= 0),
  max_select int not null default 1 check (max_select >= 0),
  sort_order int not null default 0
);
create index modifier_groups_item_idx on public.menu_item_modifier_groups (menu_item_id);

create table public.menu_item_modifiers (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  group_id uuid not null references public.menu_item_modifier_groups (id) on delete cascade,
  name text not null,
  price_delta_cents int not null default 0,
  is_available boolean not null default true,
  is_default boolean not null default false,
  sort_order int not null default 0
);
create index modifiers_group_idx on public.menu_item_modifiers (group_id);
create index modifiers_restaurant_idx on public.menu_item_modifiers (restaurant_id);

-- ----------------------------------------------------------------- delivery
create table public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name text not null,
  description text,
  fee_cents int not null default 0 check (fee_cents >= 0),
  min_minutes int not null default 30,
  max_minutes int not null default 60,
  areas text[] not null default '{}',
  radius_km numeric(6, 2),
  min_order_cents int not null default 0,
  is_active boolean not null default true,
  sort_order int not null default 0,
  check (max_minutes >= min_minutes)
);
create index delivery_zones_restaurant_idx on public.delivery_zones (restaurant_id);

create table public.delivery_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  label text not null default 'Home',
  line1 text not null,
  line2 text,
  area text not null,
  city text,
  parish text,
  instructions text,
  latitude double precision,
  longitude double precision,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index delivery_addresses_user_idx on public.delivery_addresses (user_id);

create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  full_name text not null,
  phone text not null,
  vehicle_type text not null,
  vehicle_plate text,
  region_id uuid references public.regions (id) on delete set null,
  status text not null default 'offline' check (status in ('offline', 'available', 'busy')),
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------- promotions & placements
create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants (id) on delete cascade, -- null = platform-wide
  code text,
  title text not null,
  description text,
  type text not null check (type in ('percent', 'fixed', 'free_delivery')),
  value int not null default 0 check (value >= 0),
  min_subtotal_cents int not null default 0,
  funded_by text not null default 'restaurant' check (funded_by in ('restaurant', 'platform')),
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit int,
  used_count int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index promotions_code_per_restaurant on public.promotions (coalesce(restaurant_id, '00000000-0000-0000-0000-000000000000'::uuid), code) where code is not null;
create index promotions_code_idx on public.promotions (code);

create table public.placements (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  type text not null check (type in ('featured', 'sponsored')),
  region_id uuid references public.regions (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  fee_cents int not null default 0,
  status text not null default 'scheduled' check (status in ('scheduled', 'active', 'ended', 'cancelled')),
  created_at timestamptz not null default now()
);
create index placements_active_idx on public.placements (status, starts_at, ends_at);

-- ----------------------------------------------------------------- payouts
create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete restrict,
  period_start timestamptz not null,
  period_end timestamptz not null,
  order_count int not null default 0,
  gross_sales_cents bigint not null default 0,
  commission_cents bigint not null default 0,
  adjustments_cents bigint not null default 0,
  amount_cents bigint not null default 0, -- negative = amount due from the restaurant
  currency text not null default 'JMD',
  status text not null default 'pending' check (status in ('pending', 'processing', 'paid', 'failed')),
  reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index payouts_restaurant_idx on public.payouts (restaurant_id, created_at desc);

-- ----------------------------------------------------------------- orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  tracking_token text not null unique,
  restaurant_id uuid not null references public.restaurants (id) on delete restrict,
  customer_id uuid references public.profiles (id) on delete set null, -- null = guest checkout
  contact_name text not null,
  contact_email text,
  contact_phone text not null,
  fulfillment_type text not null check (fulfillment_type in ('pickup', 'delivery')),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled')),
  delivery_address jsonb, -- snapshot at time of order
  delivery_zone_id uuid references public.delivery_zones (id) on delete set null,
  notes text,
  scheduled_for timestamptz,
  currency text not null default 'JMD',
  subtotal_cents int not null,
  discount_cents int not null default 0,
  delivery_fee_cents int not null default 0,
  service_fee_cents int not null default 0,
  tax_cents int not null default 0,
  tip_cents int not null default 0,
  total_cents int not null,
  -- Revenue split, frozen at order time so later rate changes don't rewrite history.
  commission_rate_bps int not null default 0,
  commission_cents int not null default 0,
  restaurant_payout_cents int not null default 0,
  platform_revenue_cents int not null default 0,
  delivery_revenue_cents int not null default 0,
  promotion_id uuid references public.promotions (id) on delete set null,
  payment_method text not null check (payment_method in ('cash', 'card_on_delivery', 'online')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'requires_action', 'authorized', 'paid', 'failed', 'cancelled', 'refunded', 'partially_refunded')),
  payout_id uuid references public.payouts (id) on delete set null,
  estimated_ready_at timestamptz,
  estimated_delivery_at timestamptz,
  cancel_reason text,
  idempotency_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (fulfillment_type = 'pickup' or delivery_address is not null)
);
create index orders_restaurant_created_idx on public.orders (restaurant_id, created_at desc);
create index orders_customer_created_idx on public.orders (customer_id, created_at desc);
create index orders_status_idx on public.orders (status) where status not in ('delivered', 'cancelled');
create index orders_created_idx on public.orders (created_at desc);
create index orders_unsettled_idx on public.orders (restaurant_id) where payout_id is null and status = 'delivered';
create trigger orders_updated_at before update on public.orders for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete restrict,
  menu_item_id uuid references public.menu_items (id) on delete set null,
  name text not null, -- snapshot
  unit_price_cents int not null,
  quantity int not null check (quantity between 1 and 50),
  modifiers jsonb not null default '[]',
  special_instructions text,
  line_total_cents int not null
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_menu_item_idx on public.order_items (menu_item_id);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  status text not null,
  note text,
  actor_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index order_status_history_order_idx on public.order_status_history (order_id, created_at);

create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete restrict,
  driver_id uuid references public.drivers (id) on delete set null,
  status text not null default 'unassigned' check (status in ('unassigned', 'assigned', 'picked_up', 'delivered', 'cancelled')),
  driver_payout_cents int not null default 0,
  tip_cents int not null default 0,
  assigned_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);
create index deliveries_status_idx on public.deliveries (status, created_at);
create index deliveries_driver_idx on public.deliveries (driver_id, status);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider text not null,
  method text not null check (method in ('cash', 'card_on_delivery', 'online')),
  amount_cents int not null,
  currency text not null default 'JMD',
  status text not null default 'pending'
    check (status in ('pending', 'requires_action', 'authorized', 'paid', 'failed', 'cancelled', 'refunded', 'partially_refunded')),
  provider_reference text,
  refunded_cents int not null default 0,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_order_idx on public.payments (order_id);
create unique index payments_provider_ref_idx on public.payments (provider, provider_reference) where provider_reference is not null;
create trigger payments_updated_at before update on public.payments for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------- engagement
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  order_id uuid unique references public.orders (id) on delete set null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  author_name text not null,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  reply text,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);
create index reviews_restaurant_idx on public.reviews (restaurant_id, created_at desc);

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  restaurant_id uuid references public.restaurants (id) on delete cascade,
  menu_item_id uuid references public.menu_items (id) on delete cascade,
  created_at timestamptz not null default now(),
  check ((restaurant_id is null) <> (menu_item_id is null))
);
create unique index favorites_restaurant_unique on public.favorites (user_id, restaurant_id) where restaurant_id is not null;
create unique index favorites_item_unique on public.favorites (user_id, menu_item_id) where menu_item_id is not null;

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  order_id uuid references public.orders (id) on delete cascade,
  channel text not null check (channel in ('in_app', 'email', 'sms', 'push', 'whatsapp')),
  recipient text,
  template text not null,
  title text not null,
  body text not null,
  status text not null check (status in ('queued', 'sent', 'failed', 'skipped')),
  error text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_order_idx on public.notifications (order_id);

create table public.restaurant_events (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  image_url text,
  cover_charge_cents int,
  is_published boolean not null default true
);
create index restaurant_events_idx on public.restaurant_events (restaurant_id, starts_at);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants (id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  topic text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at timestamptz not null default now()
);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  restaurant_id uuid references public.restaurants (id) on delete set null,
  user_id uuid references public.profiles (id) on delete set null,
  session_id text,
  path text,
  properties jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index analytics_events_created_idx on public.analytics_events (created_at desc, name);
create index analytics_events_restaurant_idx on public.analytics_events (restaurant_id, created_at desc);

-- =============================================================================
-- Auth integration
-- =============================================================================

-- Create a customer profile whenever someone signs up with Supabase Auth.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.raw_user_meta_data ->> 'phone')
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_restaurant_member(rid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.restaurant_users where restaurant_id = rid and user_id = auth.uid());
$$;

create or replace function public.is_assigned_driver(oid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.deliveries d join public.drivers dr on dr.id = d.driver_id
    where d.order_id = oid and dr.user_id = auth.uid()
  );
$$;

create or replace function public.can_view_order(oid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.orders o
    where o.id = oid
      and (o.customer_id = auth.uid() or public.is_restaurant_member(o.restaurant_id) or public.is_assigned_driver(o.id) or public.is_admin())
  );
$$;

-- Users may edit their own profile but never their own role.
create or replace function public.prevent_role_escalation() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_admin() and auth.role() <> 'service_role' then
    raise exception 'Only administrators can change roles';
  end if;
  return new;
end $$;
create trigger profiles_role_guard before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- Atomic job acceptance for drivers (also enforced in the app via compare-and-set).
create or replace function public.accept_delivery(p_delivery_id uuid) returns public.deliveries
language plpgsql security definer set search_path = public as $$
declare
  v_driver public.drivers;
  v_row public.deliveries;
begin
  select * into v_driver from public.drivers where user_id = auth.uid() and is_approved;
  if not found then raise exception 'Not an approved driver'; end if;
  update public.deliveries
     set driver_id = v_driver.id, status = 'assigned', assigned_at = now()
   where id = p_delivery_id and driver_id is null and status = 'unassigned'
   returning * into v_row;
  if not found then raise exception 'Delivery already taken'; end if;
  return v_row;
end $$;

-- =============================================================================
-- Row Level Security
-- The Next.js server uses the service-role key (bypasses RLS) and enforces
-- authorization in its service layer. These policies protect every table from
-- direct access with the public anon key (browser, future native apps).
-- =============================================================================

alter table public.regions enable row level security;
alter table public.restaurant_categories enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.platform_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.restaurant_category_assignments enable row level security;
alter table public.restaurant_users enable row level security;
alter table public.operating_hours enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.menu_item_modifier_groups enable row level security;
alter table public.menu_item_modifiers enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.delivery_addresses enable row level security;
alter table public.drivers enable row level security;
alter table public.promotions enable row level security;
alter table public.placements enable row level security;
alter table public.payouts enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.deliveries enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;
alter table public.notifications enable row level security;
alter table public.restaurant_events enable row level security;
alter table public.contact_messages enable row level security;
alter table public.analytics_events enable row level security;

-- Public catalogue ------------------------------------------------------------
create policy "regions readable" on public.regions for select using (true);
create policy "categories readable" on public.restaurant_categories for select using (true);
create policy "plans readable" on public.subscription_plans for select using (is_active or public.is_admin());
create policy "settings readable" on public.platform_settings for select using (true);
create policy "settings admin write" on public.platform_settings for update using (public.is_admin());

create policy "active restaurants readable" on public.restaurants for select
  using (status = 'active' or public.is_restaurant_member(id) or public.is_admin());
create policy "members update restaurant" on public.restaurants for update
  using (public.is_restaurant_member(id) or public.is_admin());

create policy "assignments readable" on public.restaurant_category_assignments for select using (true);
create policy "members manage assignments" on public.restaurant_category_assignments for all
  using (public.is_restaurant_member(restaurant_id) or public.is_admin())
  with check (public.is_restaurant_member(restaurant_id) or public.is_admin());

create policy "members see memberships" on public.restaurant_users for select
  using (user_id = auth.uid() or public.is_restaurant_member(restaurant_id) or public.is_admin());
create policy "admins manage memberships" on public.restaurant_users for all using (public.is_admin()) with check (public.is_admin());

-- Menu & hours & zones: readable when the restaurant is active; writable by its staff.
do $$
declare t text;
begin
  foreach t in array array['operating_hours', 'menu_categories', 'menu_items', 'menu_item_modifier_groups', 'menu_item_modifiers', 'delivery_zones', 'restaurant_events']
  loop
    execute format(
      'create policy "public read %1$s" on public.%1$I for select using (
         exists (select 1 from public.restaurants r where r.id = restaurant_id and r.status = ''active'')
         or public.is_restaurant_member(restaurant_id) or public.is_admin())', t);
    execute format(
      'create policy "members write %1$s" on public.%1$I for all
         using (public.is_restaurant_member(restaurant_id) or public.is_admin())
         with check (public.is_restaurant_member(restaurant_id) or public.is_admin())', t);
  end loop;
end $$;

-- Promotions: codes are only visible to the owning restaurant and admins.
create policy "promotions members read" on public.promotions for select
  using ((restaurant_id is not null and public.is_restaurant_member(restaurant_id)) or public.is_admin());
create policy "promotions members write" on public.promotions for all
  using ((restaurant_id is not null and public.is_restaurant_member(restaurant_id)) or public.is_admin())
  with check ((restaurant_id is not null and public.is_restaurant_member(restaurant_id)) or public.is_admin());

create policy "placements readable" on public.placements for select using (true);
create policy "placements admin write" on public.placements for all using (public.is_admin()) with check (public.is_admin());

create policy "payouts members read" on public.payouts for select using (public.is_restaurant_member(restaurant_id) or public.is_admin());

-- Personal data ---------------------------------------------------------------
create policy "own profile" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "update own profile" on public.profiles for update using (id = auth.uid() or public.is_admin());

create policy "own addresses" on public.delivery_addresses for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own favorites" on public.favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own notifications read" on public.notifications for select using (user_id = auth.uid() or public.is_admin());
create policy "own notifications mark read" on public.notifications for update using (user_id = auth.uid());

create policy "driver own profile" on public.drivers for select using (user_id = auth.uid() or public.is_admin());
create policy "driver update own" on public.drivers for update using (user_id = auth.uid() or public.is_admin());

-- Orders: created only by the server (service role). Read by the customer, the
-- restaurant's staff, the assigned driver and admins.
create policy "orders visible to participants" on public.orders for select using (public.can_view_order(id));
create policy "order items visible" on public.order_items for select using (public.can_view_order(order_id));
create policy "order history visible" on public.order_status_history for select using (public.can_view_order(order_id));
create policy "payments visible" on public.payments for select using (public.can_view_order(order_id));
create policy "deliveries visible" on public.deliveries for select
  using (public.can_view_order(order_id) or (status = 'unassigned' and exists (select 1 from public.drivers d where d.user_id = auth.uid() and d.is_approved)));

create policy "published reviews readable" on public.reviews for select using (is_published or user_id = auth.uid() or public.is_admin());
create policy "members reply to reviews" on public.reviews for update using (public.is_restaurant_member(restaurant_id) or public.is_admin());

-- Server-only tables: no anon/authenticated policies except admin read.
create policy "admin read contact" on public.contact_messages for select using (public.is_admin());
create policy "admin read analytics" on public.analytics_events for select using (public.is_admin());

-- =============================================================================
-- Reporting views (security_invoker so RLS of the caller applies)
-- =============================================================================
create view public.restaurant_daily_sales with (security_invoker = true) as
select
  o.restaurant_id,
  date_trunc('day', o.created_at at time zone 'America/Jamaica')::date as day,
  count(*) filter (where o.status <> 'cancelled') as orders,
  count(*) filter (where o.status = 'cancelled') as cancelled,
  coalesce(sum(o.total_cents) filter (where o.status <> 'cancelled'), 0) as gross_cents,
  coalesce(sum(o.subtotal_cents - o.discount_cents) filter (where o.status <> 'cancelled'), 0) as food_sales_cents,
  coalesce(sum(o.commission_cents) filter (where o.status <> 'cancelled'), 0) as commission_cents,
  coalesce(sum(o.restaurant_payout_cents) filter (where o.status <> 'cancelled'), 0) as payout_cents,
  coalesce(sum(o.platform_revenue_cents) filter (where o.status <> 'cancelled'), 0) as platform_revenue_cents,
  coalesce(sum(o.delivery_revenue_cents) filter (where o.status <> 'cancelled'), 0) as delivery_revenue_cents
from public.orders o
group by 1, 2;

-- =============================================================================
-- Storage: public bucket for logos, covers and menu photos.
-- Uploads go to restaurants/<restaurant_id>/... and require staff membership.
-- =============================================================================
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do nothing;

create policy "media public read" on storage.objects for select using (bucket_id = 'media');
create policy "media staff upload" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'restaurants'
    and (public.is_restaurant_member(((storage.foldername(name))[2])::uuid) or public.is_admin())
  );
create policy "media staff delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'restaurants'
    and (public.is_restaurant_member(((storage.foldername(name))[2])::uuid) or public.is_admin())
  );
