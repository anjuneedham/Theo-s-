import "server-only";
import { getDb } from "../db";
import { newId } from "../ids";
import { STATUS_CUSTOMER_COPY } from "../order-status";
import type { NotificationChannel, Order, OrderStatus } from "../types";
import { config } from "../config";
import { channels } from "./channels";

interface Dispatch {
  userId: string | null;
  orderId: string | null;
  template: string;
  title: string;
  body: string;
  email?: string | null;
  phone?: string | null;
  channels: NotificationChannel[];
}

/**
 * Sends a notification on each requested channel and records every attempt in
 * the `notifications` table with its real outcome (sent / failed / skipped when
 * a channel isn't connected). In-app notifications are always stored for
 * signed-in users.
 */
export async function dispatch(n: Dispatch) {
  const db = getDb();
  const now = new Date().toISOString();
  for (const channel of n.channels) {
    const base = {
      id: newId(),
      user_id: n.userId,
      order_id: n.orderId,
      channel,
      template: n.template,
      title: n.title,
      body: n.body,
      read_at: null,
      created_at: now,
    };
    if (channel === "in_app") {
      if (n.userId) await db.insert("notifications", { ...base, recipient: null, status: "sent", error: null });
      continue;
    }
    const recipient = channel === "email" ? n.email : n.phone;
    const impl = channels[channel];
    if (!recipient) continue;
    if (!impl.isConfigured()) {
      await db.insert("notifications", { ...base, recipient, status: "skipped", error: `${channel} provider not configured` });
      continue;
    }
    try {
      await impl.send({ to: recipient, subject: n.title, body: n.body });
      await db.insert("notifications", { ...base, recipient, status: "sent", error: null });
    } catch (err) {
      await db.insert("notifications", { ...base, recipient, status: "failed", error: (err as Error).message.slice(0, 300) });
    }
  }
}

const CUSTOMER_EVENTS: OrderStatus[] = ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"];

export async function notifyOrderStatus(order: Order, restaurantName: string) {
  if (!CUSTOMER_EVENTS.includes(order.status)) return;
  const trackUrl = `${config.siteUrl}/orders/${order.id}?token=${order.tracking_token}`;
  let copy = STATUS_CUSTOMER_COPY[order.status];
  if (order.status === "ready" && order.fulfillment_type === "pickup") copy = "Your order is ready for pickup.";
  const title = order.status === "pending" ? `Order ${order.order_number} received` : `Order ${order.order_number}: ${copy}`;
  const body = `${restaurantName}: ${copy}\nTrack your order: ${trackUrl}`;
  // SMS/WhatsApp only for the milestones customers care most about, to limit cost.
  const important: OrderStatus[] = ["confirmed", "out_for_delivery", "delivered", "cancelled", "ready"];
  const list: NotificationChannel[] = ["in_app", "email"];
  if (important.includes(order.status)) list.push("sms", "whatsapp");
  if (order.status === "ready" && order.fulfillment_type === "delivery") list.splice(list.indexOf("sms"), 2);
  await dispatch({
    userId: order.customer_id,
    orderId: order.id,
    template: `order_${order.status}`,
    title,
    body,
    email: order.contact_email,
    phone: order.contact_phone,
    channels: list,
  });
}

/** Tell restaurant staff about a new order (in-app; add SMS by listing staff phones). */
export async function notifyRestaurantNewOrder(order: Order) {
  const db = getDb();
  const staff = await db.list("restaurant_users", { restaurant_id: order.restaurant_id });
  for (const s of staff) {
    await dispatch({
      userId: s.user_id,
      orderId: order.id,
      template: "restaurant_new_order",
      title: `New ${order.fulfillment_type} order ${order.order_number}`,
      body: `${order.contact_name} placed an order. Open the partner dashboard to accept it.`,
      channels: ["in_app"],
    });
  }
}
