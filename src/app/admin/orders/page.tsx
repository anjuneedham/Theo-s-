import { Suspense } from "react";
import { getDb } from "@/lib/db";
import { listRestaurantOrders } from "@/lib/services/partner";
import { nextActionsFor } from "@/lib/services/orders";
import { PageHeader } from "@/components/dashboard/shell";
import { OrderBoard } from "@/components/dashboard/order-board";

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const [orders, restaurants] = await Promise.all([listRestaurantOrders(null, { status: status ?? "active", limit: 60 }), getDb().list("restaurants")]);
  const names = Object.fromEntries(restaurants.map((r) => [r.id, r.name]));
  return (
    <>
      <PageHeader title="Orders" description="All orders across the network. Admins can move any order through valid statuses." />
      <Suspense>
        <OrderBoard detailBase="/admin/orders" orders={orders.map((o) => ({ ...o, actions: nextActionsFor(o.order, "admin"), restaurantName: names[o.order.restaurant_id] }))} />
      </Suspense>
    </>
  );
}
