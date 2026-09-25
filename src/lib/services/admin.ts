import "server-only";
import type { z } from "zod";
import { getDb } from "../db";
import { newId } from "../ids";
import type { adminRestaurantSchema, settingsSchema } from "../validation";
import type { Order, Payout, UserRole } from "../types";
import { OrderError } from "./orders";
import { dailySeries, startOfDay, summarize, topItems } from "./partner";

const TZ = "America/Jamaica";

export async function adminDashboard() {
  const db = getDb();
  const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
  const today = startOfDay(TZ);

  const [allOrders, restaurants, customers, deliveries, recent] = await Promise.all([
    db.list("orders", {}, { range: { column: "created_at", gte: since30 } }),
    db.list("restaurants"),
    db.count("profiles", { role: "customer" }),
    db.list("deliveries", { status: ["unassigned", "assigned", "picked_up"] }),
    db.list("orders", {}, { orderBy: "created_at", ascending: false, limit: 8 }),
  ]);
  const totalOrders = await db.count("orders");
  const todayOrders = allOrders.filter((o) => o.created_at >= today);
  const month = summarize(allOrders);

  const byRestaurant = restaurants
    .map((r) => {
      const s = summarize(allOrders.filter((o) => o.restaurant_id === r.id));
      return { restaurant: r, orders: s.count, revenue: s.grossCents, commission: s.commissionCents };
    })
    .filter((x) => x.orders > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const anchorIds = restaurants.filter((r) => r.is_anchor).map((r) => r.id);
  const anchorOrders = allOrders.filter((o) => anchorIds.includes(o.restaurant_id));
  const partnerOrders = allOrders.filter((o) => !anchorIds.includes(o.restaurant_id));

  return {
    totalOrders,
    today: summarize(todayOrders),
    month,
    anchor: summarize(anchorOrders),
    partners: summarize(partnerOrders),
    activeRestaurants: restaurants.filter((r) => r.status === "active").length,
    pendingApplications: restaurants.filter((r) => r.status === "pending").length,
    activeDeliveries: deliveries.length,
    unassignedDeliveries: deliveries.filter((d) => d.status === "unassigned").length,
    customers,
    topRestaurants: byRestaurant,
    topItems: await topItems(null, since30),
    recent,
    restaurants,
    daily: dailySeries(allOrders, TZ, 14),
  };
}

export async function updateRestaurantAdmin(id: string, input: z.infer<typeof adminRestaurantSchema>) {
  const db = getDb();
  const r = await db.get("restaurants", id);
  if (!r) throw new OrderError("Restaurant not found", 404);
  if (r.is_anchor && input.status && input.status !== "active") throw new OrderError("The anchor restaurant can't be deactivated here", 409);
  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) if (v !== undefined) patch[k] = v;
  const updated = await db.update("restaurants", id, patch);
  // Approving an application promotes the owner account to the restaurant role.
  if (input.status === "active") {
    for (const m of await db.list("restaurant_users", { restaurant_id: id })) {
      const p = await db.get("profiles", m.user_id);
      if (p && p.role === "customer") await db.update("profiles", p.id, { role: "restaurant" });
    }
  }
  return updated;
}

export async function updateSettings(input: z.infer<typeof settingsSchema>) {
  if (input.service_fee_max_cents > 0 && input.service_fee_min_cents > input.service_fee_max_cents) {
    throw new OrderError("Service fee minimum can't exceed the maximum", 422);
  }
  return getDb().update("platform_settings", "default", { ...input, updated_at: new Date().toISOString() });
}

export async function listUsers(role?: UserRole) {
  return getDb().list("profiles", role ? { role } : {}, { orderBy: "created_at", ascending: false });
}

export async function setUserRole(actorId: string, userId: string, role: UserRole) {
  if (actorId === userId) throw new OrderError("You can't change your own role", 409);
  const db = getDb();
  const p = await db.get("profiles", userId);
  if (!p) throw new OrderError("User not found", 404);
  return db.update("profiles", userId, { role });
}

export async function customerSummaries() {
  const db = getDb();
  const [customers, orders] = await Promise.all([db.list("profiles", { role: "customer" }), db.list("orders")]);
  return customers
    .map((c) => {
      const mine = orders.filter((o) => o.customer_id === c.id && o.status !== "cancelled");
      return {
        profile: c,
        orders: mine.length,
        spentCents: mine.reduce((s, o) => s + o.total_cents, 0),
        lastOrderAt: mine.map((o) => o.created_at).sort().at(-1) ?? null,
      };
    })
    .sort((a, b) => b.spentCents - a.spentCents);
}

/**
 * Settlement: groups completed, unsettled orders per restaurant up to `periodEnd`.
 * Money the platform collected (online payments, cash collected by platform
 * drivers) is owed to the restaurant; money the restaurant collected itself
 * (cash/card on pickup) means the restaurant owes the platform its share.
 * A negative amount is an amount due from the restaurant.
 */
export async function generatePayouts(periodEnd: string) {
  const db = getDb();
  const orders = (await db.list("orders", { status: "delivered", payout_id: null })).filter((o) => o.created_at < periodEnd);
  const byRestaurant = new Map<string, Order[]>();
  for (const o of orders) byRestaurant.set(o.restaurant_id, [...(byRestaurant.get(o.restaurant_id) ?? []), o]);
  const created: Payout[] = [];
  for (const [restaurantId, list] of byRestaurant) {
    const restaurant = await db.get("restaurants", restaurantId);
    if (!restaurant) continue;
    let owedToRestaurant = 0;
    let owedByRestaurant = 0;
    for (const o of list) {
      const restaurantCollected = o.payment_method !== "online" && o.fulfillment_type === "pickup";
      if (restaurantCollected) owedByRestaurant += o.total_cents - o.restaurant_payout_cents;
      else owedToRestaurant += o.restaurant_payout_cents;
    }
    const starts = list.map((o) => o.created_at).sort();
    const payout: Payout = {
      id: newId(),
      restaurant_id: restaurantId,
      period_start: starts[0],
      period_end: periodEnd,
      order_count: list.length,
      gross_sales_cents: list.reduce((s, o) => s + o.subtotal_cents - o.discount_cents, 0),
      commission_cents: list.reduce((s, o) => s + o.commission_cents, 0),
      adjustments_cents: -owedByRestaurant,
      amount_cents: owedToRestaurant - owedByRestaurant,
      currency: restaurant.currency,
      status: "pending",
      reference: null,
      paid_at: null,
      created_at: new Date().toISOString(),
    };
    await db.insert("payouts", payout);
    for (const o of list) await db.update("orders", o.id, { payout_id: payout.id });
    created.push(payout);
  }
  return created;
}

export async function markPayout(id: string, status: Payout["status"], reference: string | null) {
  const db = getDb();
  const payout = await db.get("payouts", id);
  if (!payout) throw new OrderError("Payout not found", 404);
  return db.update("payouts", id, {
    status,
    reference: reference ?? payout.reference,
    paid_at: status === "paid" ? new Date().toISOString() : payout.paid_at,
  });
}

export async function analyticsReport(days = 30) {
  const db = getDb();
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const [events, orders, restaurants, reviews, history] = await Promise.all([
    db.list("analytics_events", {}, { range: { column: "created_at", gte: since } }),
    db.list("orders", {}, { range: { column: "created_at", gte: since } }),
    db.list("restaurants", { status: "active" }),
    db.list("reviews", { is_published: true }),
    db.list("order_status_history", {}, { range: { column: "created_at", gte: since } }),
  ]);
  const count = (name: string) => events.filter((e) => e.name === name).length;
  const sessions = (name: string) => new Set(events.filter((e) => e.name === name).map((e) => e.session_id ?? e.id)).size;
  const funnel = [
    { step: "Menu viewed", sessions: sessions("menu_view") },
    { step: "Product viewed", sessions: sessions("product_view") },
    { step: "Added to cart", sessions: sessions("add_to_cart") },
    { step: "Checkout started", sessions: sessions("checkout_started") },
    { step: "Order placed", sessions: orders.filter((o) => o.status !== "cancelled").length },
  ];

  // Repeat customers (identified by account or phone number).
  const byCustomer = new Map<string, number>();
  for (const o of orders.filter((o) => o.status !== "cancelled")) {
    const key = o.customer_id ?? o.contact_phone.replace(/\D/g, "");
    byCustomer.set(key, (byCustomer.get(key) ?? 0) + 1);
  }
  const customersTotal = byCustomer.size;
  const repeatCustomers = [...byCustomer.values()].filter((n) => n > 1).length;

  // Delivery performance from the status history.
  const deliveredDelivery = orders.filter((o) => o.fulfillment_type === "delivery" && o.status === "delivered");
  const durations: number[] = [];
  let onTime = 0;
  for (const o of deliveredDelivery) {
    const done = history.find((h) => h.order_id === o.id && h.status === "delivered");
    if (!done) continue;
    durations.push((new Date(done.created_at).getTime() - new Date(o.created_at).getTime()) / 60000);
    if (!o.estimated_delivery_at || done.created_at <= o.estimated_delivery_at) onTime++;
  }
  const prepTimes: number[] = [];
  for (const o of orders) {
    const c = history.find((h) => h.order_id === o.id && h.status === "confirmed");
    const r = history.find((h) => h.order_id === o.id && h.status === "ready");
    if (c && r) prepTimes.push((new Date(r.created_at).getTime() - new Date(c.created_at).getTime()) / 60000);
  }
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

  const restaurantPerformance = restaurants
    .map((r) => {
      const mine = orders.filter((o) => o.restaurant_id === r.id);
      const s = summarize(mine);
      const rv = reviews.filter((x) => x.restaurant_id === r.id);
      return {
        restaurant: r,
        orders: s.count,
        revenueCents: s.grossCents,
        avgOrderCents: s.avgOrderCents,
        cancelRate: s.count ? s.cancelled / s.count : 0,
        rating: rv.length ? rv.reduce((a, b) => a + b.rating, 0) / rv.length : null,
        reviews: rv.length,
      };
    })
    .sort((a, b) => b.revenueCents - a.revenueCents);

  return {
    days,
    pageViews: count("page_view"),
    menuViews: count("menu_view"),
    productViews: count("product_view"),
    addToCart: count("add_to_cart"),
    checkoutStarted: count("checkout_started"),
    funnel,
    summary: summarize(orders),
    customersTotal,
    repeatCustomers,
    repeatRate: customersTotal ? repeatCustomers / customersTotal : 0,
    avgDeliveryMinutes: avg(durations),
    onTimeRate: durations.length ? onTime / durations.length : null,
    avgPrepMinutes: avg(prepTimes),
    restaurantPerformance,
    trackingNote: events.length === 0 ? "No storefront events recorded yet in this period." : null,
  };
}
