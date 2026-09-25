import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getOrderForViewer, nextActionsFor } from "@/lib/services/orders";
import { OrderTracker } from "@/components/orders/order-tracker";

export const metadata: Metadata = { title: "Track your order", robots: { index: false } };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ token?: string; new?: string; paid?: string; payment?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getSessionUser();
  const result = await getOrderForViewer(id, { user, token: sp.token });
  if (!result) notFound();
  const { detail, actor } = result;
  const actions = actor === "guest" ? (detail.order.status === "pending" ? ["cancelled" as const] : []) : nextActionsFor(detail.order, actor);
  const { tracking_token: _t, ...order } = detail.order;
  void _t;
  return (
    <OrderTracker
      initial={{ ...detail, order: { ...order, tracking_token: "" } }}
      token={sp.token ?? null}
      canCancel={actions.includes("cancelled") && (actor === "customer" || actor === "guest")}
      canReview={actor === "customer" && detail.order.status === "delivered" && !detail.reviewed}
      justPlaced={sp.new === "1"}
      paymentCancelled={sp.payment === "cancelled"}
    />
  );
}
