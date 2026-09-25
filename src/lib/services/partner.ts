import "server-only";
import type { z } from "zod";
import { getDb } from "../db";
import { newId, slugify } from "../ids";
import type {
  deliveryZoneSchema,
  hoursSchema,
  menuCategorySchema,
  menuItemSchema,
  modifierGroupInputSchema,
  promotionSchema,
  restaurantProfileSchema,
} from "../validation";
import type { MenuItem, Order, Promotion } from "../types";
import { OrderError } from "./orders";

/** Every function here assumes the caller already passed `requireRestaurantAccess`. */

async function ownedRow<T extends "menu_categories" | "menu_items" | "delivery_zones" | "promotions" | "reviews">(
  table: T,
  restaurantId: string,
  id: string,
) {
  const row = await getDb().get(table, id);
  if (!row || (row as { restaurant_id: string | null }).restaurant_id !== restaurantId) throw new OrderError("Not found", 404);
  return row;
}

// ---------------------------------------------------------------- categories

export async function createCategory(restaurantId: string, input: z.infer<typeof menuCategorySchema>) {
  const db = getDb();
  const existing = await db.list("menu_categories", { restaurant_id: restaurantId });
  let slug = slugify(input.name) || "category";
  if (existing.some((c) => c.slug === slug)) slug = `${slug}-${existing.length + 1}`;
  return db.insert("menu_categories", {
    id: newId(),
    restaurant_id: restaurantId,
    name: input.name,
    slug,
    description: input.description ?? null,
    sort_order: input.sort_order ?? existing.length,
    is_active: input.is_active ?? true,
    available_from: input.available_from ?? null,
    available_until: input.available_until ?? null,
  });
}

export async function updateCategory(restaurantId: string, id: string, input: Partial<z.infer<typeof menuCategorySchema>>) {
  await ownedRow("menu_categories", restaurantId, id);
  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) if (v !== undefined) patch[k] = v;
  return getDb().update("menu_categories", id, patch);
}

export async function deleteCategory(restaurantId: string, id: string) {
  await ownedRow("menu_categories", restaurantId, id);
  const items = await getDb().count("menu_items", { category_id: id });
  if (items > 0) throw new OrderError("Move or delete the items in this category first", 409);
  await getDb().remove("menu_categories", id);
}

// ---------------------------------------------------------------- items

async function replaceModifierGroups(restaurantId: string, itemId: string, groups: z.infer<typeof modifierGroupInputSchema>[]) {
  const db = getDb();
  const oldGroups = await db.list("menu_item_modifier_groups", { menu_item_id: itemId });
  for (const g of oldGroups) {
    for (const m of await db.list("menu_item_modifiers", { group_id: g.id })) await db.remove("menu_item_modifiers", m.id);
    await db.remove("menu_item_modifier_groups", g.id);
  }
  for (const [gi, g] of groups.entries()) {
    if (g.max_select > 0 && g.min_select > g.max_select) throw new OrderError(`"${g.name}": minimum can't exceed maximum`, 422);
    const groupId = newId();
    await db.insert("menu_item_modifier_groups", {
      id: groupId,
      restaurant_id: restaurantId,
      menu_item_id: itemId,
      name: g.name,
      min_select: g.min_select,
      max_select: g.max_select,
      sort_order: gi,
    });
    await db.insertMany(
      "menu_item_modifiers",
      g.modifiers.map((m, mi) => ({
        id: newId(),
        restaurant_id: restaurantId,
        group_id: groupId,
        name: m.name,
        price_delta_cents: m.price_delta_cents,
        is_available: m.is_available,
        is_default: m.is_default,
        sort_order: mi,
      })),
    );
  }
}

export async function createItem(restaurantId: string, input: z.infer<typeof menuItemSchema>) {
  await ownedRow("menu_categories", restaurantId, input.category_id);
  const db = getDb();
  const count = await db.count("menu_items", { category_id: input.category_id });
  const item: MenuItem = {
    id: newId(),
    restaurant_id: restaurantId,
    category_id: input.category_id,
    name: input.name,
    description: input.description ?? null,
    price_cents: input.price_cents,
    image_url: input.image_url ?? null,
    is_available: input.is_available ?? true,
    is_featured: input.is_featured ?? false,
    dietary_tags: input.dietary_tags ?? [],
    spice_level: input.spice_level ?? 0,
    sort_order: input.sort_order ?? count,
    created_at: new Date().toISOString(),
  };
  await db.insert("menu_items", item);
  if (input.modifier_groups) await replaceModifierGroups(restaurantId, item.id, input.modifier_groups);
  return item;
}

export async function updateItem(restaurantId: string, id: string, input: Partial<z.infer<typeof menuItemSchema>>) {
  await ownedRow("menu_items", restaurantId, id);
  if (input.category_id) await ownedRow("menu_categories", restaurantId, input.category_id);
  const { modifier_groups, ...rest } = input;
  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rest)) if (v !== undefined) patch[k] = v;
  const item = Object.keys(patch).length ? await getDb().update("menu_items", id, patch) : await getDb().get("menu_items", id);
  if (modifier_groups) await replaceModifierGroups(restaurantId, id, modifier_groups);
  return item;
}

export async function deleteItem(restaurantId: string, id: string) {
  await ownedRow("menu_items", restaurantId, id);
  await replaceModifierGroups(restaurantId, id, []);
  // Past orders keep their item snapshot (name, price, modifiers) in order_items.
  await getDb().remove("menu_items", id);
}

// ---------------------------------------------------------------- profile, hours, zones

export async function updateProfile(restaurantId: string, input: z.infer<typeof restaurantProfileSchema>) {
  return getDb().update("restaurants", restaurantId, input);
}

export async function replaceHours(restaurantId: string, input: z.infer<typeof hoursSchema>) {
  const db = getDb();
  const existing = await db.list("operating_hours", { restaurant_id: restaurantId });
  for (const h of input.hours) {
    const row = existing.find((e) => e.day_of_week === h.day_of_week);
    if (row) await db.update("operating_hours", row.id, h);
    else await db.insert("operating_hours", { id: newId(), restaurant_id: restaurantId, ...h });
  }
  return db.list("operating_hours", { restaurant_id: restaurantId }, { orderBy: "day_of_week" });
}

export async function createZone(restaurantId: string, input: z.infer<typeof deliveryZoneSchema>) {
  if (input.max_minutes < input.min_minutes) throw new OrderError("Max time must be at least min time", 422);
  const count = await getDb().count("delivery_zones", { restaurant_id: restaurantId });
  return getDb().insert("delivery_zones", {
    id: newId(),
    restaurant_id: restaurantId,
    ...input,
    description: input.description ?? null,
    radius_km: input.radius_km ?? null,
    sort_order: input.sort_order ?? count + 1,
  });
}

export async function updateZone(restaurantId: string, id: string, input: z.infer<typeof deliveryZoneSchema>) {
  await ownedRow("delivery_zones", restaurantId, id);
  if (input.max_minutes < input.min_minutes) throw new OrderError("Max time must be at least min time", 422);
  return getDb().update("delivery_zones", id, { ...input, radius_km: input.radius_km ?? null });
}

export async function deleteZone(restaurantId: string, id: string) {
  await ownedRow("delivery_zones", restaurantId, id);
  const inUse = await getDb().count("orders", { delivery_zone_id: id, status: ["pending", "confirmed", "preparing", "ready", "out_for_delivery"] });
  if (inUse) throw new OrderError("This zone has active orders. Deactivate it instead.", 409);
  await getDb().remove("delivery_zones", id);
}

// ---------------------------------------------------------------- promotions

export async function createPromotion(restaurantId: string | null, input: z.infer<typeof promotionSchema>, fundedBy: Promotion["funded_by"]) {
  if (input.type === "percent" && input.value > 10000) throw new OrderError("Percent discounts can't exceed 100%", 422);
  if (input.code) {
    const clash = (await getDb().list("promotions", { code: input.code })).find((p) => p.restaurant_id === restaurantId);
    if (clash) throw new OrderError("That code is already in use", 409);
  }
  return getDb().insert("promotions", {
    id: newId(),
    restaurant_id: restaurantId,
    ...input,
    description: input.description ?? null,
    starts_at: input.starts_at ?? null,
    ends_at: input.ends_at ?? null,
    usage_limit: input.usage_limit ?? null,
    funded_by: fundedBy,
    used_count: 0,
    created_at: new Date().toISOString(),
  });
}

export async function updatePromotion(restaurantId: string | null, id: string, input: Partial<z.infer<typeof promotionSchema>>) {
  const promo = await getDb().get("promotions", id);
  if (!promo || promo.restaurant_id !== restaurantId) throw new OrderError("Not found", 404);
  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) if (v !== undefined) patch[k] = v;
  return getDb().update("promotions", id, patch);
}

export async function replyToReview(restaurantId: string, id: string, reply: string | null) {
  await ownedRow("reviews", restaurantId, id);
  return getDb().update("reviews", id, { reply: reply?.trim() || null });
}

// ---------------------------------------------------------------- dashboards

export function startOfDay(timeZone: string, date = new Date()): string {
  // Midnight in the restaurant's zone, as an ISO instant.
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  const offsetMinutes = tzOffsetMinutes(timeZone, date);
  const midnightUtc = new Date(`${parts}T00:00:00.000Z`).getTime() - offsetMinutes * 60000;
  return new Date(midnightUtc).toISOString();
}

function tzOffsetMinutes(timeZone: string, date: Date): number {
  const local = new Date(date.toLocaleString("en-US", { timeZone }));
  const utc = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  return Math.round((local.getTime() - utc.getTime()) / 60000);
}

export interface OrderSummary {
  count: number;
  completed: number;
  cancelled: number;
  active: number;
  grossCents: number;
  foodSalesCents: number;
  payoutCents: number;
  commissionCents: number;
  platformRevenueCents: number;
  deliveryRevenueCents: number;
  serviceFeeCents: number;
  avgOrderCents: number;
}

export function summarize(orders: Order[]): OrderSummary {
  const valid = orders.filter((o) => o.status !== "cancelled");
  const sum = (f: (o: Order) => number) => valid.reduce((s, o) => s + f(o), 0);
  const gross = sum((o) => o.total_cents);
  return {
    count: orders.length,
    completed: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
    active: orders.filter((o) => !["delivered", "cancelled"].includes(o.status)).length,
    grossCents: gross,
    foodSalesCents: sum((o) => o.subtotal_cents - o.discount_cents),
    payoutCents: sum((o) => o.restaurant_payout_cents),
    commissionCents: sum((o) => o.commission_cents),
    platformRevenueCents: sum((o) => o.platform_revenue_cents),
    deliveryRevenueCents: sum((o) => o.delivery_revenue_cents),
    serviceFeeCents: sum((o) => o.service_fee_cents),
    avgOrderCents: valid.length ? Math.round(gross / valid.length) : 0,
  };
}

export async function topItems(restaurantIds: string[] | null, since: string, limit = 5) {
  const db = getDb();
  const orders = (await db.list("orders", restaurantIds ? { restaurant_id: restaurantIds } : {}, { range: { column: "created_at", gte: since } })).filter(
    (o) => o.status !== "cancelled",
  );
  if (!orders.length) return [];
  const items = await db.list("order_items", { order_id: orders.map((o) => o.id) });
  const map = new Map<string, { name: string; restaurant_id: string; quantity: number; revenue: number }>();
  for (const i of items) {
    const key = i.menu_item_id ?? i.name;
    const cur = map.get(key) ?? { name: i.name, restaurant_id: i.restaurant_id, quantity: 0, revenue: 0 };
    cur.quantity += i.quantity;
    cur.revenue += i.line_total_cents;
    map.set(key, cur);
  }
  return [...map.values()].sort((a, b) => b.quantity - a.quantity).slice(0, limit);
}

export async function partnerDashboard(restaurantId: string, timeZone: string) {
  const db = getDb();
  const today = startOfDay(timeZone);
  const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
  const [todayOrders, monthOrders, pending, reviews, top] = await Promise.all([
    db.list("orders", { restaurant_id: restaurantId }, { range: { column: "created_at", gte: today } }),
    db.list("orders", { restaurant_id: restaurantId }, { range: { column: "created_at", gte: since30 } }),
    db.list("orders", { restaurant_id: restaurantId, status: ["pending", "confirmed", "preparing", "ready"] }, { orderBy: "created_at" }),
    db.list("reviews", { restaurant_id: restaurantId }, { orderBy: "created_at", ascending: false, limit: 5 }),
    topItems([restaurantId], since30),
  ]);
  return { today: summarize(todayOrders), month: summarize(monthOrders), pending, reviews, top, daily: dailySeries(monthOrders, timeZone, 14) };
}

export function dailySeries(orders: Order[], timeZone: string, days: number) {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
  const buckets = new Map<string, { orders: number; revenue: number }>();
  for (let i = days - 1; i >= 0; i--) buckets.set(fmt.format(new Date(Date.now() - i * 86400000)), { orders: 0, revenue: 0 });
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    const key = fmt.format(new Date(o.created_at));
    const b = buckets.get(key);
    if (b) {
      b.orders += 1;
      b.revenue += o.total_cents;
    }
  }
  return [...buckets.entries()].map(([date, v]) => ({ date, ...v }));
}

export async function listRestaurantOrders(restaurantIds: string[] | null, filter: { status?: string; limit?: number } = {}) {
  const db = getDb();
  const where: Record<string, unknown> = {};
  if (restaurantIds) where.restaurant_id = restaurantIds;
  if (filter.status === "active") where.status = ["pending", "confirmed", "preparing", "ready", "out_for_delivery"];
  else if (filter.status && filter.status !== "all") where.status = filter.status;
  const orders = await db.list("orders", where, { orderBy: "created_at", ascending: false, limit: filter.limit ?? 100 });
  const items = orders.length ? await db.list("order_items", { order_id: orders.map((o) => o.id) }) : [];
  return orders.map((o) => ({ order: o, items: items.filter((i) => i.order_id === o.id) }));
}
