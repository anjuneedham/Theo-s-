/**
 * Domain types. Field names intentionally match the PostgreSQL column names
 * (snake_case) so rows can move between the database and the app without a
 * mapping layer. Money is always stored as integer minor units (cents).
 */

export type ID = string;
export type ISODate = string;

export type UserRole = "customer" | "restaurant" | "driver" | "admin";

export interface Profile {
  id: ID;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  marketing_opt_in: boolean;
  created_at: ISODate;
}

export interface Region {
  id: ID;
  slug: string;
  name: string;
  country: string;
  currency: string;
  timezone: string;
  is_active: boolean;
  sort_order: number;
}

export type RestaurantStatus = "pending" | "active" | "suspended" | "rejected";

export interface Restaurant {
  id: ID;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  region_id: ID | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  address_line: string | null;
  area: string | null;
  city: string | null;
  parish: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  currency: string;
  logo_url: string | null;
  cover_url: string | null;
  status: RestaurantStatus;
  is_anchor: boolean;
  is_featured: boolean;
  plan_id: ID | null;
  /** Per-restaurant override, in basis points (1500 = 15%). Null = use plan/platform default. */
  commission_rate_bps: number | null;
  accepts_delivery: boolean;
  accepts_pickup: boolean;
  min_order_cents: number;
  prep_time_minutes: number;
  rating_avg: number;
  rating_count: number;
  social_instagram: string | null;
  social_facebook: string | null;
  social_tiktok: string | null;
  created_at: ISODate;
}

export interface RestaurantCategory {
  id: ID;
  slug: string;
  name: string;
  sort_order: number;
}

export interface RestaurantCategoryAssignment {
  id: ID;
  restaurant_id: ID;
  category_id: ID;
}

export type RestaurantMemberRole = "owner" | "manager" | "staff";

export interface RestaurantUser {
  id: ID;
  restaurant_id: ID;
  user_id: ID;
  role: RestaurantMemberRole;
  created_at: ISODate;
}

export interface SubscriptionPlan {
  id: ID;
  slug: string;
  name: string;
  description: string | null;
  monthly_fee_cents: number;
  commission_rate_bps: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

export interface OperatingHours {
  id: ID;
  restaurant_id: ID;
  /** 0 = Sunday … 6 = Saturday */
  day_of_week: number;
  opens_at: string; // "HH:MM" 24h
  closes_at: string; // "HH:MM"; may be <= opens_at to indicate past midnight
  is_closed: boolean;
}

export interface MenuCategory {
  id: ID;
  restaurant_id: ID;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  /** Optional daily availability window, e.g. breakfast 07:00–11:00. */
  available_from: string | null;
  available_until: string | null;
}

export interface MenuItem {
  id: ID;
  restaurant_id: ID;
  category_id: ID;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  dietary_tags: string[];
  spice_level: number; // 0–3
  sort_order: number;
  created_at: ISODate;
}

export interface ModifierGroup {
  id: ID;
  restaurant_id: ID;
  menu_item_id: ID;
  name: string;
  min_select: number;
  max_select: number;
  sort_order: number;
}

export interface Modifier {
  id: ID;
  restaurant_id: ID;
  group_id: ID;
  name: string;
  price_delta_cents: number;
  is_available: boolean;
  is_default: boolean;
  sort_order: number;
}

export type FulfillmentType = "pickup" | "delivery";

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type PaymentMethod = "cash" | "card_on_delivery" | "online";
export type PaymentStatus =
  | "pending"
  | "requires_action"
  | "authorized"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded"
  | "partially_refunded";

export interface AddressSnapshot {
  label?: string | null;
  line1: string;
  line2?: string | null;
  area: string;
  city?: string | null;
  parish?: string | null;
  instructions?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface Order {
  id: ID;
  order_number: string;
  tracking_token: string;
  restaurant_id: ID;
  customer_id: ID | null;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string;
  fulfillment_type: FulfillmentType;
  status: OrderStatus;
  delivery_address: AddressSnapshot | null;
  delivery_zone_id: ID | null;
  notes: string | null;
  scheduled_for: ISODate | null;
  currency: string;
  subtotal_cents: number;
  discount_cents: number;
  delivery_fee_cents: number;
  service_fee_cents: number;
  tax_cents: number;
  tip_cents: number;
  total_cents: number;
  commission_rate_bps: number;
  commission_cents: number;
  restaurant_payout_cents: number;
  platform_revenue_cents: number;
  delivery_revenue_cents: number;
  promotion_id: ID | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payout_id: ID | null;
  estimated_ready_at: ISODate | null;
  estimated_delivery_at: ISODate | null;
  cancel_reason: string | null;
  idempotency_key: string | null;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface OrderItemModifier {
  group: string;
  name: string;
  price_delta_cents: number;
}

export interface OrderItem {
  id: ID;
  order_id: ID;
  restaurant_id: ID;
  menu_item_id: ID | null;
  name: string;
  unit_price_cents: number;
  quantity: number;
  modifiers: OrderItemModifier[];
  special_instructions: string | null;
  line_total_cents: number;
}

export interface OrderStatusHistory {
  id: ID;
  order_id: ID;
  status: OrderStatus;
  note: string | null;
  actor_id: ID | null;
  created_at: ISODate;
}

export interface DeliveryZone {
  id: ID;
  restaurant_id: ID;
  name: string;
  description: string | null;
  fee_cents: number;
  min_minutes: number;
  max_minutes: number;
  /** Communities/areas served by this zone (matched case-insensitively). */
  areas: string[];
  /** Optional radius from the restaurant, used when the customer shares GPS location. */
  radius_km: number | null;
  min_order_cents: number;
  is_active: boolean;
  sort_order: number;
}

export interface DeliveryAddress {
  id: ID;
  user_id: ID;
  label: string;
  line1: string;
  line2: string | null;
  area: string;
  city: string | null;
  parish: string | null;
  instructions: string | null;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  created_at: ISODate;
}

export type DriverStatus = "offline" | "available" | "busy";

export interface Driver {
  id: ID;
  user_id: ID;
  full_name: string;
  phone: string;
  vehicle_type: string;
  vehicle_plate: string | null;
  region_id: ID | null;
  status: DriverStatus;
  is_approved: boolean;
  created_at: ISODate;
}

export type DeliveryStatus = "unassigned" | "assigned" | "picked_up" | "delivered" | "cancelled";

export interface Delivery {
  id: ID;
  order_id: ID;
  restaurant_id: ID;
  driver_id: ID | null;
  status: DeliveryStatus;
  driver_payout_cents: number;
  tip_cents: number;
  assigned_at: ISODate | null;
  picked_up_at: ISODate | null;
  delivered_at: ISODate | null;
  created_at: ISODate;
}

export interface Payment {
  id: ID;
  order_id: ID;
  provider: string;
  method: PaymentMethod;
  amount_cents: number;
  currency: string;
  status: PaymentStatus;
  provider_reference: string | null;
  refunded_cents: number;
  failure_reason: string | null;
  created_at: ISODate;
  updated_at: ISODate;
}

export type PayoutStatus = "pending" | "processing" | "paid" | "failed";

export interface Payout {
  id: ID;
  restaurant_id: ID;
  period_start: ISODate;
  period_end: ISODate;
  order_count: number;
  gross_sales_cents: number;
  commission_cents: number;
  adjustments_cents: number;
  amount_cents: number;
  currency: string;
  status: PayoutStatus;
  reference: string | null;
  paid_at: ISODate | null;
  created_at: ISODate;
}

export interface Review {
  id: ID;
  restaurant_id: ID;
  order_id: ID | null;
  user_id: ID;
  author_name: string;
  rating: number;
  comment: string | null;
  reply: string | null;
  is_published: boolean;
  created_at: ISODate;
}

export type PromotionType = "percent" | "fixed" | "free_delivery";

export interface Promotion {
  id: ID;
  /** Null = platform-wide promotion. */
  restaurant_id: ID | null;
  code: string | null;
  title: string;
  description: string | null;
  type: PromotionType;
  /** percent: basis points; fixed: cents; free_delivery: ignored */
  value: number;
  min_subtotal_cents: number;
  funded_by: "restaurant" | "platform";
  starts_at: ISODate | null;
  ends_at: ISODate | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  created_at: ISODate;
}

export type PlacementType = "featured" | "sponsored";

export interface Placement {
  id: ID;
  restaurant_id: ID;
  type: PlacementType;
  region_id: ID | null;
  starts_at: ISODate;
  ends_at: ISODate;
  fee_cents: number;
  status: "scheduled" | "active" | "ended" | "cancelled";
  created_at: ISODate;
}

export interface Favorite {
  id: ID;
  user_id: ID;
  restaurant_id: ID | null;
  menu_item_id: ID | null;
  created_at: ISODate;
}

export type NotificationChannel = "in_app" | "email" | "sms" | "push" | "whatsapp";
export type NotificationStatus = "queued" | "sent" | "failed" | "skipped";

export interface Notification {
  id: ID;
  user_id: ID | null;
  order_id: ID | null;
  channel: NotificationChannel;
  recipient: string | null;
  template: string;
  title: string;
  body: string;
  status: NotificationStatus;
  error: string | null;
  read_at: ISODate | null;
  created_at: ISODate;
}

export interface RestaurantEvent {
  id: ID;
  restaurant_id: ID;
  title: string;
  description: string | null;
  starts_at: ISODate;
  ends_at: ISODate | null;
  image_url: string | null;
  cover_charge_cents: number | null;
  is_published: boolean;
}

export interface ContactMessage {
  id: ID;
  restaurant_id: ID | null;
  name: string;
  email: string;
  phone: string | null;
  topic: string;
  message: string;
  status: "new" | "read" | "archived";
  created_at: ISODate;
}

export interface AnalyticsEvent {
  id: ID;
  name: string;
  restaurant_id: ID | null;
  user_id: ID | null;
  session_id: string | null;
  path: string | null;
  properties: Record<string, unknown>;
  created_at: ISODate;
}

export interface PlatformSettings {
  id: string; // always "default"
  platform_name: string;
  currency: string;
  default_commission_bps: number;
  service_fee_bps: number;
  service_fee_min_cents: number;
  service_fee_max_cents: number;
  /** Direct orders from the anchor restaurant (Theo's) skip the service fee unless this is on. */
  service_fee_on_anchor: boolean;
  tax_rate_bps: number;
  tax_inclusive: boolean;
  driver_base_payout_cents: number;
  /** Share of the delivery fee paid to the driver, in basis points, on top of the base. */
  driver_fee_share_bps: number;
  payment_methods: PaymentMethod[];
  allow_guest_checkout: boolean;
  support_email: string;
  support_phone: string;
  updated_at: ISODate;
}

/** Local-mode only: password hashes live outside `profiles` so they can never be selected with it. */
export interface LocalCredential {
  id: ID; // = profile id
  email: string;
  password_hash: string;
}

export interface TableMap {
  profiles: Profile;
  regions: Region;
  restaurants: Restaurant;
  restaurant_categories: RestaurantCategory;
  restaurant_category_assignments: RestaurantCategoryAssignment;
  restaurant_users: RestaurantUser;
  subscription_plans: SubscriptionPlan;
  operating_hours: OperatingHours;
  menu_categories: MenuCategory;
  menu_items: MenuItem;
  menu_item_modifier_groups: ModifierGroup;
  menu_item_modifiers: Modifier;
  orders: Order;
  order_items: OrderItem;
  order_status_history: OrderStatusHistory;
  delivery_zones: DeliveryZone;
  delivery_addresses: DeliveryAddress;
  drivers: Driver;
  deliveries: Delivery;
  payments: Payment;
  payouts: Payout;
  reviews: Review;
  promotions: Promotion;
  placements: Placement;
  favorites: Favorite;
  notifications: Notification;
  restaurant_events: RestaurantEvent;
  contact_messages: ContactMessage;
  analytics_events: AnalyticsEvent;
  platform_settings: PlatformSettings;
  local_credentials: LocalCredential;
}

export type TableName = keyof TableMap;
export type Row<T extends TableName> = TableMap[T];
