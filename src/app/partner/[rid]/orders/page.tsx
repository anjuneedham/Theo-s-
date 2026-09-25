import { Suspense } from "react";
import { requirePageUser } from "@/lib/auth/guards";
import { listRestaurantOrders } from "@/lib/services/partner";
import { nextActionsFor } from "@/lib/services/orders";
import { PageHeader } from "@/components/dashboard/shell";
import { OrderBoard } from "@/components/dashboard/order-board";

export default async function PartnerOrders({ params, searchParams }: { params: Promise<{ rid: string }>; searchParams: Promise<{ status?: string }> }) {
  const { rid } = await params;
  const { status } = await searchParams;
  const user = await requirePageUser(`/partner/${rid}/orders`);
  const actor = user.role === "admin" ? "admin" : "restaurant";
  const orders = await listRestaurantOrders([rid], { status: status ?? "active" });
  return (
    <>
      <PageHeader title="Orders" description="Accept new orders, update their status and hand delivery orders to drivers." />
      <Suspense>
        <OrderBoard orders={orders.map((o) => ({ ...o, actions: nextActionsFor(o.order, actor) }))} />
      </Suspense>
    </>
  );
}
