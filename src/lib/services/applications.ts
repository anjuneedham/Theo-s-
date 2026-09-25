import "server-only";
import type { z } from "zod";
import { getDb } from "../db";
import { newId, slugify } from "../ids";
import type { partnerApplicationSchema } from "../validation";
import type { SessionUser } from "../auth/session";
import { OrderError } from "./orders";

/**
 * A partner application creates a restaurant in PENDING status owned by the
 * applicant. It is invisible to customers until an admin approves it.
 */
export async function submitPartnerApplication(user: SessionUser, input: z.infer<typeof partnerApplicationSchema>) {
  const db = getDb();
  const existing = await db.list("restaurant_users", { user_id: user.id });
  if (existing.length >= 5) throw new OrderError("Too many restaurants on one account — contact support", 409);
  let slug = slugify(input.restaurant_name) || "restaurant";
  if (await db.findOne("restaurants", { slug })) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  const settings = await db.get("platform_settings", "default");
  const now = new Date().toISOString();
  const restaurantId = newId();
  await db.insert("restaurants", {
    id: restaurantId,
    slug,
    name: input.restaurant_name,
    tagline: null,
    description: input.description ?? null,
    region_id: input.region_id ?? null,
    phone: input.phone,
    email: input.email,
    whatsapp: null,
    address_line: input.address_line ?? null,
    area: null,
    city: input.city,
    parish: input.parish,
    country: "JM",
    latitude: null,
    longitude: null,
    timezone: "America/Jamaica",
    currency: settings?.currency ?? "JMD",
    logo_url: null,
    cover_url: null,
    status: "pending",
    is_anchor: false,
    is_featured: false,
    plan_id: input.plan_id ?? null,
    commission_rate_bps: null,
    accepts_delivery: input.accepts_delivery,
    accepts_pickup: true,
    min_order_cents: 0,
    prep_time_minutes: 25,
    rating_avg: 0,
    rating_count: 0,
    social_instagram: null,
    social_facebook: null,
    social_tiktok: null,
    created_at: now,
  });
  await db.insert("restaurant_users", { id: newId(), restaurant_id: restaurantId, user_id: user.id, role: "owner", created_at: now });
  await db.insertMany(
    "restaurant_category_assignments",
    input.cuisine_category_ids.map((category_id) => ({ id: newId(), restaurant_id: restaurantId, category_id })),
  );
  await db.insertMany(
    "operating_hours",
    [0, 1, 2, 3, 4, 5, 6].map((d) => ({ id: newId(), restaurant_id: restaurantId, day_of_week: d, opens_at: "11:00", closes_at: "21:00", is_closed: false })),
  );
  return { restaurantId, slug };
}

export async function saveContactMessage(input: { name: string; email: string; phone: string | null; topic: string; message: string }, restaurantId: string | null) {
  return getDb().insert("contact_messages", {
    id: newId(),
    restaurant_id: restaurantId,
    name: input.name,
    email: input.email,
    phone: input.phone,
    topic: input.topic,
    message: input.message,
    status: "new",
    created_at: new Date().toISOString(),
  });
}
