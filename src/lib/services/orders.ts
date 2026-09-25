import "server-only";
import { getDb } from "../db";
import { newId, orderNumber, secureToken } from "../ids";
import { computeTotals, checkPromotion, priceLine, resolveCommissionBps, PricingError, type PricedLine } from "../pricing";
import { resolveZone } from "../zones";
import { isOpenAt, isWithinWindow } from "../hours";
import { canTransition, allowedTransitions, type Actor } from "../order-status";
import { availablePaymentMethods, providerFor } from "../payments";
import { notifyOrderStatus, notifyRestaurantNewOrder } from "../notifications";
import { config } from "../config";
import type { PlaceOrderInput, QuoteInput } from "../validation";
import type { Delivery, DeliveryZone, Order, OrderItem, OrderStatus, Promotion, Restaurant } from "../types";
import type { SessionUser } from "../auth/session";
import { ForbiddenError } from "../auth/guards";
import { getSettings } from "./catalog";

export class OrderError extends Error {
  constructor(
    message: string,
    public status = 400,
    public code = "order_error",
  ) {
    super(message);
  }
}

interface PreparedOrder {
  restaurant: Restaurant;
  lines: (PricedLine & { special_instructions: string | null })[];
  zone: DeliveryZone | null;
  promotion: Promotion | null;
  promoMessage: string | null;
  totals: ReturnType<typeof computeTotals>;
  isOpen: boolean;
}

/** Price an order entirely from database values. Shared by quote and placeOrder. */
async function prepare(input: QuoteInput, opts: { strictPromo: boolean }): Promise<PreparedOrder> {
  const db = getDb();
  const restaurant = await db.get("restaurants", input.restaurant_id);
  if (!restaurant || restaurant.status !== "active") throw new OrderError("This restaurant isn't accepting orders", 404);
  if (input.fulfillment_type === "delivery" && !restaurant.accepts_delivery) {
    throw new OrderError(`${restaurant.name} doesn't offer delivery right now`);
  }
  if (input.fulfillment_type === "pickup" && !restaurant.accepts_pickup) {
    throw new OrderError(`${restaurant.name} doesn't offer pickup right now`);
  }

  const itemIds = [...new Set(input.items.map((i) => i.menu_item_id))];
  const [settings, plans, items, groups, modifiers, categories, zones, hours] = await Promise.all([
    getSettings(),
    db.list("subscription_plans"),
    db.list("menu_items", { id: itemIds }),
    db.list("menu_item_modifier_groups", { menu_item_id: itemIds }),
    db.list("menu_item_modifiers", { restaurant_id: restaurant.id }),
    db.list("menu_categories", { restaurant_id: restaurant.id }),
    db.list("delivery_zones", { restaurant_id: restaurant.id }),
    db.list("operating_hours", { restaurant_id: restaurant.id }),
  ]);

  const now = new Date();
  const lines = input.items.map((line) => {
    const item = items.find((i) => i.id === line.menu_item_id && i.restaurant_id === restaurant.id);
    if (!item) throw new OrderError("An item in your cart is no longer on the menu. Please review your cart.", 409, "item_missing");
    const category = categories.find((c) => c.id === item.category_id);
    if (!category || !category.is_active) throw new OrderError(`${item.name} is no longer available`, 409, "item_unavailable");
    if (!isWithinWindow(category.available_from, category.available_until, restaurant.timezone, now)) {
      throw new OrderError(
        `${item.name} is only served ${category.available_from}–${category.available_until}. Please remove it to continue.`,
        409,
        "outside_window",
      );
    }
    const itemGroups = groups.filter((g) => g.menu_item_id === item.id);
    const itemMods = modifiers.filter((m) => itemGroups.some((g) => g.id === m.group_id));
    try {
      return {
        ...priceLine({ item, groups: itemGroups, modifiers: itemMods, selectedModifierIds: line.modifier_ids, quantity: line.quantity }),
        special_instructions: line.special_instructions ?? null,
      };
    } catch (err) {
      if (err instanceof PricingError) throw new OrderError(err.message, 409, err.code);
      throw err;
    }
  });

  let zone: DeliveryZone | null = null;
  if (input.fulfillment_type === "delivery") {
    zone = resolveZone(zones, { area: input.area, latitude: input.latitude, longitude: input.longitude }, restaurant);
  }

  const subtotal = lines.reduce((s, l) => s + l.line_total_cents, 0);
  let promotion: Promotion | null = null;
  let promoMessage: string | null = null;
  if (input.promo_code) {
    const code = input.promo_code.trim().toUpperCase();
    const candidates = await db.list("promotions", { code });
    const promo = candidates.find((p) => p.restaurant_id === restaurant.id) ?? candidates.find((p) => p.restaurant_id === null);
    if (!promo) {
      promoMessage = "That promo code isn't valid";
    } else {
      const check = checkPromotion(promo, { restaurantId: restaurant.id, subtotalCents: subtotal, fulfillment: input.fulfillment_type, now });
      if (check.ok) promotion = promo;
      else promoMessage = check.reason ?? "That promo code can't be used";
    }
    if (!promotion && opts.strictPromo) throw new OrderError(promoMessage ?? "Invalid promo code", 422, "invalid_promo");
  }

  let totals;
  try {
    totals = computeTotals({
      lines,
      fulfillment: input.fulfillment_type,
      zone,
      restaurant,
      commissionBps: resolveCommissionBps(restaurant, plans, settings),
      settings,
      promotion,
      tipCents: input.tip_cents,
    });
  } catch (err) {
    if (err instanceof PricingError) throw new OrderError(err.message, 422, err.code);
    throw err;
  }

  return { restaurant, lines, zone, promotion, promoMessage, totals, isOpen: isOpenAt(hours, restaurant.timezone, now) };
}

export async function quoteOrder(input: QuoteInput) {
  const p = await prepare(input, { strictPromo: false });
  return {
    restaurant_id: p.restaurant.id,
    currency: p.restaurant.currency,
    lines: p.lines,
    zone: p.zone ? { id: p.zone.id, name: p.zone.name, min_minutes: p.zone.min_minutes, max_minutes: p.zone.max_minutes } : null,
    promotion: p.promotion ? { code: p.promotion.code, title: p.promotion.title } : null,
    promo_message: p.promoMessage,
    totals: {
      subtotal_cents: p.totals.subtotal_cents,
      discount_cents: p.totals.discount_cents,
      delivery_fee_cents: p.totals.delivery_fee_cents,
      service_fee_cents: p.totals.service_fee_cents,
      tax_cents: p.totals.tax_cents,
      tip_cents: p.totals.tip_cents,
      total_cents: p.totals.total_cents,
    },
    is_open: p.isOpen,
    prep_time_minutes: p.restaurant.prep_time_minutes,
  };
}

export async function placeOrder(input: PlaceOrderInput, user: SessionUser | null) {
  const db = getDb();
  const settings = await getSettings();

  if (!user && !settings.allow_guest_checkout) throw new OrderError("Please sign in to place an order", 401);
  if (!availablePaymentMethods(settings.payment_methods).includes(input.payment_method)) {
    throw new OrderError("That payment method isn't available. Please choose another.", 422, "payment_unavailable");
  }
  if (input.fulfillment_type === "delivery" && !input.address) {
    throw new OrderError("Please enter a delivery address", 422, "address_required");
  }

  if (input.idempotency_key) {
    const existing = await db.findOne("orders", { idempotency_key: input.idempotency_key });
    if (existing) return { order: existing, redirect_url: null };
  }

  const prepared = await prepare(
    { ...input, area: input.address?.area ?? input.area, latitude: input.address?.latitude ?? input.latitude, longitude: input.address?.longitude ?? input.longitude },
    { strictPromo: true },
  );
  const { restaurant, lines, zone, promotion, totals } = prepared;

  let scheduledFor: string | null = null;
  if (input.scheduled_for) {
    const when = new Date(input.scheduled_for);
    const hours = await db.list("operating_hours", { restaurant_id: restaurant.id });
    if (when.getTime() < Date.now() + 15 * 60000 || when.getTime() > Date.now() + 7 * 86400000) {
      throw new OrderError("Scheduled time must be between 15 minutes and 7 days from now", 422);
    }
    if (!isOpenAt(hours, restaurant.timezone, when)) throw new OrderError(`${restaurant.name} is closed at that time`, 422, "closed");
    scheduledFor = when.toISOString();
  } else if (!prepared.isOpen) {
    throw new OrderError(`${restaurant.name} is closed right now. You can schedule your order for later.`, 422, "closed");
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const start = scheduledFor ? new Date(scheduledFor) : now;
  const readyAt = new Date(start.getTime() + restaurant.prep_time_minutes * 60000);
  const orderId = newId();
  const order: Order = {
    id: orderId,
    order_number: orderNumber(restaurant.is_anchor ? "TH" : "TN"),
    tracking_token: secureToken(),
    restaurant_id: restaurant.id,
    customer_id: user?.id ?? null,
    contact_name: input.contact_name,
    contact_email: input.contact_email ?? user?.email ?? null,
    contact_phone: input.contact_phone,
    fulfillment_type: input.fulfillment_type,
    status: "pending",
    delivery_address: input.fulfillment_type === "delivery" && input.address ? { ...input.address } : null,
    delivery_zone_id: zone?.id ?? null,
    notes: input.notes ?? null,
    scheduled_for: scheduledFor,
    currency: restaurant.currency,
    subtotal_cents: totals.subtotal_cents,
    discount_cents: totals.discount_cents,
    delivery_fee_cents: totals.delivery_fee_cents,
    service_fee_cents: totals.service_fee_cents,
    tax_cents: totals.tax_cents,
    tip_cents: totals.tip_cents,
    total_cents: totals.total_cents,
    commission_rate_bps: totals.commission_rate_bps,
    commission_cents: totals.commission_cents,
    restaurant_payout_cents: totals.restaurant_payout_cents,
    platform_revenue_cents: totals.platform_revenue_cents,
    delivery_revenue_cents: totals.delivery_revenue_cents,
    promotion_id: promotion?.id ?? null,
    payment_method: input.payment_method,
    payment_status: "pending",
    payout_id: null,
    estimated_ready_at: readyAt.toISOString(),
    estimated_delivery_at: zone ? new Date(readyAt.getTime() + zone.max_minutes * 60000).toISOString() : null,
    cancel_reason: null,
    idempotency_key: input.idempotency_key ?? null,
    created_at: nowIso,
    updated_at: nowIso,
  };

  await db.insert("orders", order);
  const orderItems: OrderItem[] = lines.map((l) => ({
    id: newId(),
    order_id: orderId,
    restaurant_id: restaurant.id,
    menu_item_id: l.menu_item_id,
    name: l.name,
    unit_price_cents: l.unit_price_cents,
    quantity: l.quantity,
    modifiers: l.modifiers,
    special_instructions: l.special_instructions,
    line_total_cents: l.line_total_cents,
  }));
  await db.insertMany("order_items", orderItems);
  await db.insert("order_status_history", {
    id: newId(),
    order_id: orderId,
    status: "pending",
    note: scheduledFor ? `Scheduled for ${scheduledFor}` : null,
    actor_id: user?.id ?? null,
    created_at: nowIso,
  });
  if (order.fulfillment_type === "delivery") {
    const delivery: Delivery = {
      id: newId(),
      order_id: orderId,
      restaurant_id: restaurant.id,
      driver_id: null,
      status: "unassigned",
      driver_payout_cents: totals.driver_payout_cents,
      tip_cents: totals.tip_cents,
      assigned_at: null,
      picked_up_at: null,
      delivered_at: null,
      created_at: nowIso,
    };
    await db.insert("deliveries", delivery);
  }
  if (promotion) await db.update("promotions", promotion.id, { used_count: promotion.used_count + 1 });

  if (user && input.save_address && input.address) {
    const existing = await db.list("delivery_addresses", { user_id: user.id });
    const duplicate = existing.find((a) => a.line1.toLowerCase() === input.address!.line1.toLowerCase() && a.area === input.address!.area);
    if (!duplicate) {
      await db.insert("delivery_addresses", {
        id: newId(),
        user_id: user.id,
        label: input.address.label ?? (existing.length ? "Saved address" : "Home"),
        line1: input.address.line1,
        line2: input.address.line2 ?? null,
        area: input.address.area,
        city: input.address.city ?? null,
        parish: input.address.parish ?? null,
        instructions: input.address.instructions ?? null,
        latitude: input.address.latitude ?? null,
        longitude: input.address.longitude ?? null,
        is_default: existing.length === 0,
        created_at: nowIso,
      });
    }
  }

  // Payment: offline methods stay PENDING until collected; online returns a hosted checkout URL.
  const provider = providerFor(input.payment_method);
  const trackUrl = `${config.siteUrl}/orders/${orderId}?token=${order.tracking_token}`;
  let redirectUrl: string | null = null;
  const paymentId = newId();
  try {
    const result = await provider.createPayment(order, { successUrl: `${trackUrl}&paid=1`, cancelUrl: `${trackUrl}&payment=cancelled` });
    await db.insert("payments", {
      id: paymentId,
      order_id: orderId,
      provider: provider.id,
      method: input.payment_method,
      amount_cents: order.total_cents,
      currency: order.currency,
      status: result.status,
      provider_reference: result.provider_reference,
      refunded_cents: 0,
      failure_reason: null,
      created_at: nowIso,
      updated_at: nowIso,
    });
    if (result.status !== "pending") await db.update("orders", orderId, { payment_status: result.status });
    order.payment_status = result.status;
    redirectUrl = result.redirect_url ?? null;
  } catch (err) {
    await db.insert("payments", {
      id: paymentId,
      order_id: orderId,
      provider: provider.id,
      method: input.payment_method,
      amount_cents: order.total_cents,
      currency: order.currency,
      status: "failed",
      provider_reference: null,
      refunded_cents: 0,
      failure_reason: (err as Error).message.slice(0, 300),
      created_at: nowIso,
      updated_at: nowIso,
    });
    await db.update("orders", orderId, { payment_status: "failed", status: "cancelled", cancel_reason: "Payment could not be started" });
    throw new OrderError("We couldn't start the online payment. Your order was not placed — please try again or pay on delivery.", 502, "payment_failed");
  }

  await db.insert("analytics_events", {
    id: newId(),
    name: "checkout_completed",
    restaurant_id: restaurant.id,
    user_id: user?.id ?? null,
    session_id: null,
    path: "/checkout",
    properties: { order_id: orderId, total_cents: order.total_cents, fulfillment: order.fulfillment_type },
    created_at: nowIso,
  });

  await safeNotify(async () => {
    await notifyOrderStatus(order, restaurant.name);
    await notifyRestaurantNewOrder(order);
  });

  return { order, redirect_url: redirectUrl };
}

async function safeNotify(fn: () => Promise<void>) {
  try {
    await fn();
  } catch (err) {
    console.error("[theos] notification error", err);
  }
}

export interface OrderDetail {
  order: Order;
  items: OrderItem[];
  history: Awaited<ReturnType<typeof listHistory>>;
  restaurant: Pick<Restaurant, "id" | "name" | "slug" | "phone" | "whatsapp" | "address_line" | "city" | "is_anchor"> | null;
  delivery: Delivery | null;
  driver: { full_name: string; phone: string; vehicle_type: string } | null;
  zone: Pick<DeliveryZone, "name" | "min_minutes" | "max_minutes"> | null;
  reviewed: boolean;
}

function listHistory(orderId: string) {
  return getDb().list("order_status_history", { order_id: orderId }, { orderBy: "created_at" });
}

/** Role of `user` relative to an order, or null if they have no access. */
export async function actorFor(order: Order, user: SessionUser | null): Promise<Actor | null> {
  if (!user) return null;
  if (user.role === "admin") return "admin";
  const db = getDb();
  if (user.role === "restaurant") {
    const m = await db.findOne("restaurant_users", { restaurant_id: order.restaurant_id, user_id: user.id });
    if (m) return "restaurant";
  }
  if (user.role === "driver") {
    const driver = await db.findOne("drivers", { user_id: user.id });
    const delivery = await db.findOne("deliveries", { order_id: order.id });
    // Drivers only see customer details for deliveries assigned to them.
    if (driver && delivery && delivery.driver_id === driver.id) return "driver";
  }
  if (order.customer_id && order.customer_id === user.id) return "customer";
  return null;
}

export async function getOrderForViewer(orderId: string, viewer: { user: SessionUser | null; token?: string | null }) {
  const db = getDb();
  const order = await db.get("orders", orderId);
  if (!order) return null;
  const actor = await actorFor(order, viewer.user);
  const tokenOk = Boolean(viewer.token) && viewer.token === order.tracking_token;
  if (!actor && !tokenOk) return null;
  const [items, history, restaurant, delivery, zone, review] = await Promise.all([
    db.list("order_items", { order_id: orderId }),
    listHistory(orderId),
    db.get("restaurants", order.restaurant_id),
    db.findOne("deliveries", { order_id: orderId }),
    order.delivery_zone_id ? db.get("delivery_zones", order.delivery_zone_id) : Promise.resolve(null),
    db.findOne("reviews", { order_id: orderId }),
  ]);
  const driverRow = delivery?.driver_id ? await db.get("drivers", delivery.driver_id) : null;
  const detail: OrderDetail = {
    order,
    items,
    history,
    restaurant: restaurant
      ? {
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
          phone: restaurant.phone,
          whatsapp: restaurant.whatsapp,
          address_line: restaurant.address_line,
          city: restaurant.city,
          is_anchor: restaurant.is_anchor,
        }
      : null,
    delivery,
    driver: driverRow ? { full_name: driverRow.full_name, phone: driverRow.phone, vehicle_type: driverRow.vehicle_type } : null,
    zone: zone ? { name: zone.name, min_minutes: zone.min_minutes, max_minutes: zone.max_minutes } : null,
    reviewed: Boolean(review),
  };
  return { detail, actor: actor ?? ("guest" as const) };
}

export async function updateOrderStatus(
  orderId: string,
  to: OrderStatus,
  user: SessionUser | null,
  opts: { note?: string | null; token?: string | null } = {},
) {
  const db = getDb();
  const order = await db.get("orders", orderId);
  if (!order) throw new OrderError("Order not found", 404);
  let actor = await actorFor(order, user);
  // Guests may cancel their own pending order using the tracking token.
  if (!actor && opts.token && opts.token === order.tracking_token) actor = "customer";
  if (!actor) throw new ForbiddenError();

  if (!canTransition(order.status, to, order.fulfillment_type, actor)) {
    throw new OrderError(`Can't change an order from ${order.status} to ${to}`, 409, "invalid_transition");
  }
  if (to === "confirmed" && order.payment_method === "online" && order.payment_status !== "paid" && actor !== "admin") {
    throw new OrderError("This order hasn't been paid online yet", 409, "awaiting_payment");
  }

  const nowIso = new Date().toISOString();
  const patch: Partial<Order> = { status: to, updated_at: nowIso };
  if (to === "cancelled") patch.cancel_reason = opts.note ?? (actor === "customer" ? "Cancelled by customer" : "Cancelled by restaurant");
  if (to === "confirmed") {
    const restaurant = await db.get("restaurants", order.restaurant_id);
    const readyAt = new Date(Date.now() + (restaurant?.prep_time_minutes ?? 25) * 60000);
    patch.estimated_ready_at = readyAt.toISOString();
    if (order.delivery_zone_id) {
      const zone = await db.get("delivery_zones", order.delivery_zone_id);
      if (zone) patch.estimated_delivery_at = new Date(readyAt.getTime() + zone.max_minutes * 60000).toISOString();
    }
  }

  const delivery = await db.findOne("deliveries", { order_id: orderId });
  const payment = await db.findOne("payments", { order_id: orderId });
  const offlineCollected = to === "delivered" && payment?.provider === "offline" && payment.status === "pending";
  const cancelPending = to === "cancelled" && (payment?.status === "pending" || payment?.status === "requires_action");
  if (offlineCollected) patch.payment_status = "paid";
  if (cancelPending) patch.payment_status = "cancelled";

  // Optimistic concurrency: only apply if nobody else moved the order meanwhile.
  const updated = await db.updateIf("orders", orderId, { status: order.status }, patch);
  if (!updated) throw new OrderError("This order was just updated by someone else. Refresh and try again.", 409, "conflict");

  // Keep delivery + payment records in step with the order.
  if (delivery) {
    if (to === "out_for_delivery") {
      const driver = user ? await db.findOne("drivers", { user_id: user.id }) : null;
      await db.update("deliveries", delivery.id, {
        status: "picked_up",
        picked_up_at: nowIso,
        driver_id: delivery.driver_id ?? driver?.id ?? null,
        assigned_at: delivery.assigned_at ?? nowIso,
      });
    }
    if (to === "delivered") await db.update("deliveries", delivery.id, { status: "delivered", delivered_at: nowIso });
    if (to === "cancelled") await db.update("deliveries", delivery.id, { status: "cancelled" });
  }
  if (payment) {
    // Staff confirmed handover — cash/card collected.
    if (offlineCollected) await db.update("payments", payment.id, { status: "paid", updated_at: nowIso });
    if (cancelPending) await db.update("payments", payment.id, { status: "cancelled", updated_at: nowIso });
    if (to === "cancelled" && payment.status === "paid" && payment.provider !== "offline") {
      // Online refunds are processed by an admin from the order page so they can be verified.
      await db.update("payments", payment.id, { failure_reason: "Refund required: order cancelled after payment", updated_at: nowIso });
    }
  }
  await db.insert("order_status_history", {
    id: newId(),
    order_id: orderId,
    status: to,
    note: opts.note ?? null,
    actor_id: user?.id ?? null,
    created_at: nowIso,
  });

  const restaurant = await db.get("restaurants", order.restaurant_id);
  await safeNotify(() => notifyOrderStatus(updated, restaurant?.name ?? "Theo's"));
  return updated;
}

export function nextActionsFor(order: Order, actor: Actor) {
  return allowedTransitions(order.status, order.fulfillment_type, actor);
}

/** Apply a verified payment-provider webhook to our records. */
export async function applyPaymentWebhook(result: { order_id: string | null; provider_reference: string | null; status: Order["payment_status"] | null; amount_cents?: number }) {
  if (!result.order_id || !result.status) return;
  const db = getDb();
  const order = await db.get("orders", result.order_id);
  if (!order) return;
  const payment = await db.findOne("payments", { order_id: order.id });
  const nowIso = new Date().toISOString();
  if (payment) {
    if (result.provider_reference && payment.provider_reference && payment.provider_reference !== result.provider_reference) return;
    if (result.status === "paid" && result.amount_cents !== undefined && result.amount_cents !== payment.amount_cents) {
      // Never mark an order paid for the wrong amount — flag it for manual review instead.
      await db.update("payments", payment.id, { failure_reason: `Amount mismatch: received ${result.amount_cents}, expected ${payment.amount_cents}`, updated_at: nowIso });
      return;
    }
    await db.update("payments", payment.id, { status: result.status, updated_at: nowIso });
  }
  await db.update("orders", order.id, { payment_status: result.status, updated_at: nowIso });
  if (result.status === "paid") await notifyRestaurantNewOrder(order);
  if ((result.status === "failed" || result.status === "cancelled") && order.status === "pending") {
    await updateOrderStatus(order.id, "cancelled", null, { note: "Online payment was not completed" }).catch(() => undefined);
  }
}

/** Refund an online payment (admin only). Offline payments are marked refunded without a provider call. */
export async function refundOrder(orderId: string, user: SessionUser, amountCents?: number) {
  if (user.role !== "admin") throw new ForbiddenError();
  const db = getDb();
  const payment = await db.findOne("payments", { order_id: orderId });
  if (!payment) throw new OrderError("No payment found for this order", 404);
  if (payment.status !== "paid" && payment.status !== "partially_refunded") throw new OrderError("Only paid orders can be refunded", 409);
  const amount = amountCents ?? payment.amount_cents - payment.refunded_cents;
  const { getProvider } = await import("../payments");
  const provider = getProvider(payment.provider);
  if (!provider?.refund) throw new OrderError(`Refunds aren't supported for ${payment.provider}`, 501);
  const result = await provider.refund(payment, amount);
  const nowIso = new Date().toISOString();
  await db.update("payments", payment.id, { status: result.status, refunded_cents: result.refunded_cents, failure_reason: null, updated_at: nowIso });
  await db.update("orders", orderId, { payment_status: result.status, updated_at: nowIso });
  return result;
}

/**
 * Rebuild cart lines from a past order against the CURRENT menu (prices and
 * availability may have changed). Items no longer offered are reported back.
 */
export async function reorderLines(orderId: string, viewer: { user: SessionUser | null; token?: string | null }) {
  const result = await getOrderForViewer(orderId, viewer);
  if (!result) throw new OrderError("Order not found", 404);
  const { order, items } = result.detail;
  const db = getDb();
  const restaurant = await db.get("restaurants", order.restaurant_id);
  if (!restaurant || restaurant.status !== "active") throw new OrderError("This restaurant isn't taking orders right now", 409);
  const [menuItems, groups, modifiers, categories] = await Promise.all([
    db.list("menu_items", { restaurant_id: restaurant.id }),
    db.list("menu_item_modifier_groups", { restaurant_id: restaurant.id }),
    db.list("menu_item_modifiers", { restaurant_id: restaurant.id }),
    db.list("menu_categories", { restaurant_id: restaurant.id }),
  ]);
  const lines = [];
  const unavailable: string[] = [];
  for (const oi of items) {
    const item = menuItems.find((m) => m.id === oi.menu_item_id);
    if (!item || !item.is_available) {
      unavailable.push(oi.name);
      continue;
    }
    const itemGroups = groups.filter((g) => g.menu_item_id === item.id);
    const mods = oi.modifiers
      .map((om) => {
        const g = itemGroups.find((x) => x.name === om.group);
        const m = g && modifiers.find((x) => x.group_id === g.id && x.name === om.name && x.is_available);
        return m ? { id: m.id, name: m.name, group: om.group, price_delta_cents: m.price_delta_cents } : null;
      })
      .filter((m): m is NonNullable<typeof m> => Boolean(m));
    lines.push({
      menu_item_id: item.id,
      name: item.name,
      image_url: item.image_url,
      category: categories.find((c) => c.id === item.category_id)?.name ?? "",
      base_price_cents: item.price_cents,
      modifiers: mods,
      quantity: oi.quantity,
      special_instructions: oi.special_instructions,
      is_alcohol: item.dietary_tags.includes("alcohol"),
    });
  }
  return {
    restaurant: { id: restaurant.id, slug: restaurant.slug, name: restaurant.name, currency: restaurant.currency, is_anchor: restaurant.is_anchor },
    lines,
    unavailable,
  };
}
