import type { FulfillmentType, OrderStatus, UserRole } from "./types";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const STATUS_CUSTOMER_COPY: Record<OrderStatus, string> = {
  pending: "We've received your order and are waiting for the kitchen to confirm it.",
  confirmed: "Your order has been confirmed.",
  preparing: "Your order is being prepared.",
  ready: "Your order is ready.",
  out_for_delivery: "Your order is out for delivery.",
  delivered: "Your order has been delivered. Enjoy!",
  cancelled: "Your order was cancelled.",
};

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["out_for_delivery", "delivered", "cancelled"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: [],
};

export type Actor = UserRole | "system";

/**
 * Returns the statuses an actor may move an order to. Pickup orders skip
 * OUT_FOR_DELIVERY ("delivered" means collected); delivery orders must go
 * through a driver before they can be marked delivered.
 */
export function allowedTransitions(
  from: OrderStatus,
  fulfillment: FulfillmentType,
  actor: Actor,
): OrderStatus[] {
  let next = TRANSITIONS[from].filter((to) => {
    if (fulfillment === "pickup" && to === "out_for_delivery") return false;
    if (fulfillment === "delivery" && from === "ready" && to === "delivered") return false;
    return true;
  });

  switch (actor) {
    case "admin":
    case "system":
      break;
    case "restaurant":
      // Restaurants hand delivery orders to drivers; they can't mark them delivered.
      next = next.filter((to) => !(fulfillment === "delivery" && (to === "out_for_delivery" || to === "delivered")));
      break;
    case "driver":
      next = next.filter((to) => fulfillment === "delivery" && (to === "out_for_delivery" || to === "delivered"));
      break;
    case "customer":
      next = from === "pending" ? next.filter((to) => to === "cancelled") : [];
      break;
  }
  return next;
}

export function canTransition(
  from: OrderStatus,
  to: OrderStatus,
  fulfillment: FulfillmentType,
  actor: Actor,
): boolean {
  return allowedTransitions(from, fulfillment, actor).includes(to);
}

export function isActiveStatus(status: OrderStatus): boolean {
  return status !== "delivered" && status !== "cancelled";
}

/** Ordered steps shown on the tracking timeline. */
export function timelineFor(fulfillment: FulfillmentType): OrderStatus[] {
  return fulfillment === "delivery"
    ? ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered"]
    : ["pending", "confirmed", "preparing", "ready", "delivered"];
}

export function statusLabel(status: OrderStatus, fulfillment?: FulfillmentType): string {
  if (status === "delivered" && fulfillment === "pickup") return "Picked up";
  if (status === "ready" && fulfillment === "pickup") return "Ready for pickup";
  return STATUS_LABELS[status];
}
