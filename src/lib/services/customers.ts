import "server-only";
import { getDb } from "../db";
import { newId } from "../ids";
import type { SessionUser } from "../auth/session";
import type { DeliveryAddress } from "../types";
import type { z } from "zod";
import type { addressSchema } from "../validation";
import { OrderError } from "./orders";

type AddressInput = z.infer<typeof addressSchema>;

export async function listAddresses(userId: string) {
  const rows = await getDb().list("delivery_addresses", { user_id: userId }, { orderBy: "created_at" });
  return rows.sort((a, b) => Number(b.is_default) - Number(a.is_default));
}

export async function createAddress(user: SessionUser, input: AddressInput & { is_default?: boolean }) {
  const db = getDb();
  const existing = await listAddresses(user.id);
  if (existing.length >= 20) throw new OrderError("You can save up to 20 addresses", 422);
  const makeDefault = input.is_default || existing.length === 0;
  if (makeDefault) for (const a of existing.filter((a) => a.is_default)) await db.update("delivery_addresses", a.id, { is_default: false });
  const row: DeliveryAddress = {
    id: newId(),
    user_id: user.id,
    label: input.label ?? "Address",
    line1: input.line1,
    line2: input.line2 ?? null,
    area: input.area,
    city: input.city ?? null,
    parish: input.parish ?? null,
    instructions: input.instructions ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    is_default: makeDefault,
    created_at: new Date().toISOString(),
  };
  return db.insert("delivery_addresses", row);
}

async function ownAddress(user: SessionUser, id: string) {
  const address = await getDb().get("delivery_addresses", id);
  if (!address || address.user_id !== user.id) throw new OrderError("Address not found", 404);
  return address;
}

export async function updateAddress(user: SessionUser, id: string, input: Partial<AddressInput> & { is_default?: boolean }) {
  const db = getDb();
  await ownAddress(user, id);
  if (input.is_default) {
    for (const a of (await listAddresses(user.id)).filter((a) => a.is_default && a.id !== id)) {
      await db.update("delivery_addresses", a.id, { is_default: false });
    }
  }
  const patch: Partial<DeliveryAddress> = {};
  for (const key of ["label", "line1", "line2", "area", "city", "parish", "instructions", "latitude", "longitude", "is_default"] as const) {
    if (input[key] !== undefined) (patch as Record<string, unknown>)[key] = input[key];
  }
  return db.update("delivery_addresses", id, patch);
}

export async function deleteAddress(user: SessionUser, id: string) {
  const address = await ownAddress(user, id);
  const db = getDb();
  await db.remove("delivery_addresses", id);
  if (address.is_default) {
    const [next] = await listAddresses(user.id);
    if (next) await db.update("delivery_addresses", next.id, { is_default: true });
  }
}

export async function listCustomerOrders(userId: string) {
  const db = getDb();
  const orders = await db.list("orders", { customer_id: userId }, { orderBy: "created_at", ascending: false, limit: 100 });
  if (orders.length === 0) return [];
  const [items, restaurants] = await Promise.all([
    db.list("order_items", { order_id: orders.map((o) => o.id) }),
    db.list("restaurants", { id: [...new Set(orders.map((o) => o.restaurant_id))] }),
  ]);
  return orders.map((o) => ({
    order: o,
    items: items.filter((i) => i.order_id === o.id),
    restaurant: restaurants.find((r) => r.id === o.restaurant_id) ?? null,
  }));
}

export async function listFavorites(userId: string) {
  const db = getDb();
  const favs = await db.list("favorites", { user_id: userId }, { orderBy: "created_at", ascending: false });
  const restaurantIds = favs.map((f) => f.restaurant_id).filter((x): x is string => Boolean(x));
  const itemIds = favs.map((f) => f.menu_item_id).filter((x): x is string => Boolean(x));
  const [restaurants, items] = await Promise.all([
    restaurantIds.length ? db.list("restaurants", { id: restaurantIds }) : Promise.resolve([]),
    itemIds.length ? db.list("menu_items", { id: itemIds }) : Promise.resolve([]),
  ]);
  const itemRestaurants = items.length ? await db.list("restaurants", { id: [...new Set(items.map((i) => i.restaurant_id))] }) : [];
  return {
    restaurants: restaurants.filter((r) => r.status === "active"),
    items: items.map((i) => ({ item: i, restaurant: itemRestaurants.find((r) => r.id === i.restaurant_id) ?? null })),
  };
}

export async function toggleFavorite(user: SessionUser, target: { restaurant_id?: string | null; menu_item_id?: string | null }) {
  const db = getDb();
  if (!target.restaurant_id === !target.menu_item_id) throw new OrderError("Choose a restaurant or a dish", 422);
  const filter = target.restaurant_id
    ? { user_id: user.id, restaurant_id: target.restaurant_id }
    : { user_id: user.id, menu_item_id: target.menu_item_id! };
  const existing = await db.findOne("favorites", filter);
  if (existing) {
    await db.remove("favorites", existing.id);
    return { favorited: false };
  }
  if (target.restaurant_id && !(await db.get("restaurants", target.restaurant_id))) throw new OrderError("Restaurant not found", 404);
  if (target.menu_item_id && !(await db.get("menu_items", target.menu_item_id))) throw new OrderError("Dish not found", 404);
  await db.insert("favorites", {
    id: newId(),
    user_id: user.id,
    restaurant_id: target.restaurant_id ?? null,
    menu_item_id: target.menu_item_id ?? null,
    created_at: new Date().toISOString(),
  });
  return { favorited: true };
}

export async function favoriteIds(userId: string | undefined) {
  if (!userId) return { restaurants: [] as string[], items: [] as string[] };
  const favs = await getDb().list("favorites", { user_id: userId });
  return {
    restaurants: favs.map((f) => f.restaurant_id).filter((x): x is string => Boolean(x)),
    items: favs.map((f) => f.menu_item_id).filter((x): x is string => Boolean(x)),
  };
}

export async function updateProfile(user: SessionUser, input: { full_name: string; phone?: string | null; marketing_opt_in?: boolean }) {
  const patch: Record<string, unknown> = { full_name: input.full_name, phone: input.phone ?? null };
  if (input.marketing_opt_in !== undefined) patch.marketing_opt_in = input.marketing_opt_in;
  return getDb().update("profiles", user.id, patch);
}

export async function listNotifications(userId: string) {
  return getDb().list("notifications", { user_id: userId, channel: "in_app" }, { orderBy: "created_at", ascending: false, limit: 50 });
}

export async function markNotificationsRead(userId: string) {
  const db = getDb();
  const unread = (await listNotifications(userId)).filter((n) => !n.read_at);
  const now = new Date().toISOString();
  for (const n of unread) await db.update("notifications", n.id, { read_at: now });
  return unread.length;
}

export async function createReview(user: SessionUser, input: { order_id: string; rating: number; comment: string | null }) {
  const db = getDb();
  const order = await db.get("orders", input.order_id);
  if (!order || order.customer_id !== user.id) throw new OrderError("Order not found", 404);
  if (order.status !== "delivered") throw new OrderError("You can review an order once it's been delivered or collected", 409);
  if (await db.findOne("reviews", { order_id: order.id })) throw new OrderError("You've already reviewed this order", 409);
  const review = await db.insert("reviews", {
    id: newId(),
    restaurant_id: order.restaurant_id,
    order_id: order.id,
    user_id: user.id,
    author_name: user.full_name.split(" ")[0] + (user.full_name.split(" ")[1] ? ` ${user.full_name.split(" ")[1][0]}.` : ""),
    rating: input.rating,
    comment: input.comment,
    reply: null,
    is_published: true,
    created_at: new Date().toISOString(),
  });
  await refreshRating(order.restaurant_id);
  return review;
}

export async function refreshRating(restaurantId: string) {
  const db = getDb();
  const reviews = await db.list("reviews", { restaurant_id: restaurantId, is_published: true });
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  await db.update("restaurants", restaurantId, { rating_avg: Math.round(avg * 10) / 10, rating_count: reviews.length });
}

export async function listCustomerReviews(userId: string) {
  const db = getDb();
  const reviews = await db.list("reviews", { user_id: userId }, { orderBy: "created_at", ascending: false });
  const restaurants = reviews.length ? await db.list("restaurants", { id: [...new Set(reviews.map((r) => r.restaurant_id))] }) : [];
  return reviews.map((r) => ({ review: r, restaurant: restaurants.find((x) => x.id === r.restaurant_id) ?? null }));
}

/** Items the customer orders most — for "Order again". */
export async function favoriteMealsFromHistory(userId: string, limit = 6) {
  const db = getDb();
  const orders = await db.list("orders", { customer_id: userId, status: "delivered" });
  if (!orders.length) return [];
  const items = await db.list("order_items", { order_id: orders.map((o) => o.id) });
  const counts = new Map<string, number>();
  for (const i of items) if (i.menu_item_id) counts.set(i.menu_item_id, (counts.get(i.menu_item_id) ?? 0) + i.quantity);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
  const menuItems = top.length ? await db.list("menu_items", { id: top.map(([id]) => id) }) : [];
  return top
    .map(([id, count]) => ({ item: menuItems.find((m) => m.id === id), count }))
    .filter((x): x is { item: NonNullable<typeof x.item>; count: number } => Boolean(x.item));
}
