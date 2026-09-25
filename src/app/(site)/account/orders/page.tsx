import Link from "next/link";
import { Receipt, ChevronRight } from "lucide-react";
import { requirePageUser } from "@/lib/auth/guards";
import { listCustomerOrders } from "@/lib/services/customers";
import { StatusPill } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";

export default async function OrdersPage() {
  const user = await requirePageUser("/account/orders");
  const orders = await listCustomerOrders(user.id);
  if (orders.length === 0) {
    return (
      <EmptyState icon={<Receipt className="size-6" />} title="No orders yet" action={<ButtonLink href="/order">Start an order</ButtonLink>}>
        Orders you place while signed in show up here. Guest orders can be tracked with the link we send you.
      </EmptyState>
    );
  }
  return (
    <ul className="space-y-3">
      {orders.map(({ order, items, restaurant }) => (
        <li key={order.id}>
          <Link href={`/orders/${order.id}`} className="card flex items-center gap-4 p-5 transition hover:shadow-[var(--shadow-lift)]">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold">{restaurant?.name}</p>
                <StatusPill status={order.status} fulfillment={order.fulfillment_type} />
              </div>
              <p className="mt-1 truncate text-sm text-night-600">{items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}</p>
              <p className="mt-1 text-xs text-night-600">
                {order.order_number} · {new Date(order.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Jamaica" })} · {order.fulfillment_type}
              </p>
            </div>
            <span className="font-semibold tabular-nums">{formatMoney(order.total_cents, order.currency)}</span>
            <ChevronRight className="size-4 text-night-600" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
