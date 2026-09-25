import { z } from "zod";

const phone = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number")
  .max(25)
  .regex(/^[+()\d\s.-]+$/, "Enter a valid phone number");
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));
const cents = z.number().int().min(0).max(100_000_000);
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24-hour)");
const url = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || v.startsWith("/") || /^https:\/\//.test(v), "Must be an https:// URL")
  .optional()
  .nullable()
  .transform((v) => (v ? v : null));

export const addressSchema = z.object({
  label: optionalText(40),
  line1: z.string().trim().min(3, "Enter your street address").max(120),
  line2: optionalText(120),
  area: z.string().trim().min(2, "Choose your area").max(80),
  city: optionalText(80),
  parish: optionalText(80),
  instructions: optionalText(300),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
});

export const cartLineSchema = z.object({
  menu_item_id: z.string().min(1).max(64),
  quantity: z.number().int().min(1).max(50),
  modifier_ids: z.array(z.string().max(64)).max(30).default([]),
  special_instructions: optionalText(300),
});

export const quoteSchema = z.object({
  restaurant_id: z.string().min(1).max(64),
  fulfillment_type: z.enum(["pickup", "delivery"]),
  items: z.array(cartLineSchema).min(1, "Your cart is empty").max(60),
  area: optionalText(80),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  promo_code: optionalText(40),
  tip_cents: cents.optional().default(0),
});

export const placeOrderSchema = quoteSchema.extend({
  contact_name: z.string().trim().min(2, "Enter your name").max(80),
  contact_phone: phone,
  contact_email: z
    .string()
    .trim()
    .max(120)
    .optional()
    .nullable()
    .transform((v) => (v ? v.toLowerCase() : null))
    .refine((v) => v === null || z.email().safeParse(v).success, "Enter a valid email"),
  address: addressSchema.optional().nullable(),
  save_address: z.boolean().optional().default(false),
  notes: optionalText(500),
  payment_method: z.enum(["cash", "card_on_delivery", "online"]),
  scheduled_for: z.iso.datetime().optional().nullable(),
  idempotency_key: z.string().max(80).optional().nullable(),
});

export const statusUpdateSchema = z.object({
  status: z.enum(["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"]),
  note: optionalText(300),
});

export const loginSchema = z.object({
  email: z.email("Enter a valid email").max(120),
  password: z.string().min(1, "Enter your password").max(200),
});

export const signupSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.email("Enter a valid email").max(120),
  phone: phone.optional().nullable(),
  password: z.string().min(8, "Use at least 8 characters").max(200),
  marketing_opt_in: z.boolean().optional().default(false),
});

export const profileSchema = z.object({
  full_name: z.string().trim().min(2).max(80),
  phone: phone.optional().nullable(),
  marketing_opt_in: z.boolean().optional(),
});

export const reviewSchema = z.object({
  order_id: z.string().min(1).max(64),
  rating: z.number().int().min(1).max(5),
  comment: optionalText(1000),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.email("Enter a valid email").max(120),
  phone: optionalText(25),
  topic: z.enum(["general", "order", "events", "catering", "partnership", "careers"]),
  message: z.string().trim().min(10, "Tell us a little more").max(2000),
  // Honeypot — real users never fill this in.
  website: z.string().max(0).optional(),
});

export const analyticsEventSchema = z.object({
  name: z.enum([
    "page_view",
    "menu_view",
    "product_view",
    "add_to_cart",
    "checkout_started",
    "checkout_completed",
    "restaurant_view",
    "search",
  ]),
  restaurant_id: z.string().max(64).optional().nullable(),
  session_id: z.string().max(64).optional().nullable(),
  path: z.string().max(300).optional().nullable(),
  properties: z.record(z.string(), z.union([z.string().max(200), z.number(), z.boolean(), z.null()])).optional(),
});

export const partnerApplicationSchema = z.object({
  restaurant_name: z.string().trim().min(2).max(80),
  contact_name: z.string().trim().min(2).max(80),
  email: z.email().max(120),
  phone,
  password: z.string().min(8).max(200).optional(),
  city: z.string().trim().min(2).max(80),
  parish: z.string().trim().min(2).max(80),
  region_id: z.string().max(64).optional().nullable(),
  address_line: optionalText(160),
  cuisine_category_ids: z.array(z.string().max(64)).max(5).default([]),
  description: optionalText(1000),
  plan_id: z.string().max(64).optional().nullable(),
  accepts_delivery: z.boolean().default(true),
});

export const driverApplicationSchema = z.object({
  full_name: z.string().trim().min(2).max(80),
  phone,
  vehicle_type: z.enum(["Motorbike", "Car", "Bicycle", "Van"]),
  vehicle_plate: optionalText(20),
  region_id: z.string().max(64).optional().nullable(),
});

// ---------------- Partner / admin management

export const menuCategorySchema = z.object({
  name: z.string().trim().min(1).max(60),
  description: optionalText(300),
  sort_order: z.number().int().min(0).max(999).optional(),
  is_active: z.boolean().optional(),
  available_from: hhmm.optional().nullable(),
  available_until: hhmm.optional().nullable(),
});

export const modifierGroupInputSchema = z.object({
  id: z.string().max(64).optional(),
  name: z.string().trim().min(1).max(60),
  min_select: z.number().int().min(0).max(20),
  max_select: z.number().int().min(0).max(20),
  modifiers: z
    .array(
      z.object({
        id: z.string().max(64).optional(),
        name: z.string().trim().min(1).max(60),
        price_delta_cents: z.number().int().min(-10_000_00).max(10_000_000),
        is_available: z.boolean().default(true),
        is_default: z.boolean().default(false),
      }),
    )
    .min(1)
    .max(30),
});

export const menuItemSchema = z.object({
  category_id: z.string().min(1).max(64),
  name: z.string().trim().min(1).max(80),
  description: optionalText(500),
  price_cents: cents,
  image_url: url,
  is_available: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  dietary_tags: z.array(z.enum(["vegan", "vegetarian", "gluten-free", "alcohol", "contains-nuts", "halal"])).max(6).optional(),
  spice_level: z.number().int().min(0).max(3).optional(),
  sort_order: z.number().int().min(0).max(999).optional(),
  modifier_groups: z.array(modifierGroupInputSchema).max(10).optional(),
});

export const restaurantProfileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  tagline: optionalText(120),
  description: optionalText(1500),
  phone: optionalText(25),
  email: z
    .string()
    .trim()
    .max(120)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  whatsapp: optionalText(25),
  address_line: optionalText(160),
  area: optionalText(80),
  city: optionalText(80),
  parish: optionalText(80),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  logo_url: url,
  cover_url: url,
  accepts_delivery: z.boolean(),
  accepts_pickup: z.boolean(),
  min_order_cents: cents,
  prep_time_minutes: z.number().int().min(5).max(180),
  social_instagram: url,
  social_facebook: url,
  social_tiktok: url,
});

export const hoursSchema = z.object({
  hours: z
    .array(
      z.object({
        day_of_week: z.number().int().min(0).max(6),
        opens_at: hhmm,
        closes_at: hhmm,
        is_closed: z.boolean(),
      }),
    )
    .length(7),
});

export const deliveryZoneSchema = z.object({
  name: z.string().trim().min(1).max(60),
  description: optionalText(200),
  fee_cents: cents,
  min_minutes: z.number().int().min(5).max(240),
  max_minutes: z.number().int().min(5).max(300),
  areas: z.array(z.string().trim().min(2).max(80)).max(100),
  radius_km: z.number().min(0).max(200).optional().nullable(),
  min_order_cents: cents,
  is_active: z.boolean(),
  sort_order: z.number().int().min(0).max(999).optional(),
});

export const promotionSchema = z.object({
  code: z
    .string()
    .trim()
    .max(30)
    .regex(/^[A-Za-z0-9_-]*$/, "Letters, numbers, - and _ only")
    .optional()
    .nullable()
    .transform((v) => (v ? v.toUpperCase() : null)),
  title: z.string().trim().min(2).max(100),
  description: optionalText(300),
  type: z.enum(["percent", "fixed", "free_delivery"]),
  value: z.number().int().min(0).max(100_000_000),
  min_subtotal_cents: cents,
  starts_at: z.iso.datetime().optional().nullable(),
  ends_at: z.iso.datetime().optional().nullable(),
  usage_limit: z.number().int().min(1).max(1_000_000).optional().nullable(),
  is_active: z.boolean(),
});

export const settingsSchema = z.object({
  platform_name: z.string().trim().min(2).max(80),
  currency: z.string().length(3),
  default_commission_bps: z.number().int().min(0).max(5000),
  service_fee_bps: z.number().int().min(0).max(3000),
  service_fee_min_cents: cents,
  service_fee_max_cents: cents,
  service_fee_on_anchor: z.boolean(),
  tax_rate_bps: z.number().int().min(0).max(5000),
  tax_inclusive: z.boolean(),
  driver_base_payout_cents: cents,
  driver_fee_share_bps: z.number().int().min(0).max(10000),
  payment_methods: z.array(z.enum(["cash", "card_on_delivery", "online"])).min(1),
  allow_guest_checkout: z.boolean(),
  support_email: z.email(),
  support_phone: z.string().trim().min(7).max(25),
});

export const adminRestaurantSchema = z.object({
  status: z.enum(["pending", "active", "suspended", "rejected"]).optional(),
  is_featured: z.boolean().optional(),
  commission_rate_bps: z.number().int().min(0).max(5000).optional().nullable(),
  plan_id: z.string().max(64).optional().nullable(),
  region_id: z.string().max(64).optional().nullable(),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;
