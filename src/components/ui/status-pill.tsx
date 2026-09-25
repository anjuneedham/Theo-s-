import { cn } from "@/lib/cn";
import { statusLabel } from "@/lib/order-status";
import type { FulfillmentType, OrderStatus, PaymentStatus } from "@/lib/types";

const STATUS_TONES: Record<OrderStatus, string> = {
  pending: "bg-gold-300/40 text-gold-600 ring-gold-400/40",
  confirmed: "bg-sky-50 text-sky-700 ring-sky-200",
  preparing: "bg-ember-50 text-ember-700 ring-ember-100",
  ready: "bg-violet-50 text-violet-700 ring-violet-200",
  out_for_delivery: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  delivered: "bg-leaf-50 text-leaf-700 ring-leaf-500/30",
  cancelled: "bg-cream-200 text-night-600 ring-cream-300",
};

export function StatusPill({ status, fulfillment, className }: { status: OrderStatus; fulfillment?: FulfillmentType; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset", STATUS_TONES[status], className)}>
      <span className={cn("size-1.5 rounded-full bg-current", status !== "delivered" && status !== "cancelled" && "animate-pulse")} />
      {statusLabel(status, fulfillment)}
    </span>
  );
}

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  pending: "Payment pending",
  requires_action: "Awaiting online payment",
  authorized: "Authorized",
  paid: "Paid",
  failed: "Payment failed",
  cancelled: "Payment cancelled",
  refunded: "Refunded",
  partially_refunded: "Partially refunded",
};

export function PaymentPill({ status }: { status: PaymentStatus }) {
  const tone = status === "paid" ? "text-leaf-700 bg-leaf-50" : status === "failed" ? "text-red-700 bg-red-50" : "text-night-700 bg-cream-200";
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", tone)}>{PAYMENT_LABELS[status]}</span>;
}

export const PAYMENT_METHOD_LABELS = {
  cash: "Cash on delivery / pickup",
  card_on_delivery: "Card on delivery / pickup",
  online: "Pay online by card",
} as const;
