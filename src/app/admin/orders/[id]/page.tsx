import { notFound } from "next/navigation";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/shell";
import { Panel, DataTable, Td } from "@/components/dashboard/widgets";
import { StatusPill, PaymentPill, PAYMENT_METHOD_LABELS } from "@/components/ui/status-pill";
import { formatMoney, bpsToPercent } from "@/lib/money";
import { statusLabel } from "@/lib/order-status";
import { RefundButton } from "@/components/dashboard/refund-button";

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const order = await db.get("orders", id);
  if (!order) notFound();
  const [items, history, restaurant, payment, delivery, notifications] = await Promise.all([
    db.list("order_items", { order_id: id }),
    db.list("order_status_history", { order_id: id }, { orderBy: "created_at" }),
    db.get("restaurants", order.restaurant_id),
    db.findOne("payments", { order_id: id }),
    db.findOne("deliveries", { order_id: id }),
    db.list("notifications", { order_id: id }, { orderBy: "created_at" }),
  ]);
  const driver = delivery?.driver_id ? await db.get("drivers", delivery.driver_id) : null;
  const f = (c: number) => formatMoney(c, order.currency);
  const t = (iso: string) => new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Jamaica" });
  return (
    <>
      <PageHeader title={`Order ${order.order_number}`} description={<>{restaurant?.name} · {t(order.created_at)} · <Link className="underline" href={`/orders/${order.id}`}>customer view</Link></>} actions={<StatusPill status={order.status} fulfillment={order.fulfillment_type} />} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Revenue split (frozen at order time)">
          <dl className="space-y-2 p-5 text-sm">
            {[
              ["Subtotal", order.subtotal_cents], ["Discount", -order.discount_cents], ["Delivery fee", order.delivery_fee_cents], ["Service fee", order.service_fee_cents],
              ["Tip (driver)", order.tip_cents], ["Tax (" + (order.tax_cents ? "included" : "none") + ")", order.tax_cents],
            ].map(([l, v]) => <div key={l as string} className="flex justify-between"><dt className="text-night-600">{l}</dt><dd className="tabular-nums">{f(v as number)}</dd></div>)}
            <div className="flex justify-between border-t border-cream-200 pt-2 font-bold"><dt>Customer total</dt><dd>{f(order.total_cents)}</dd></div>
            <div className="mt-3 flex justify-between"><dt className="text-night-600">Commission ({bpsToPercent(order.commission_rate_bps)})</dt><dd className="tabular-nums">{f(order.commission_cents)}</dd></div>
            <div className="flex justify-between"><dt className="text-night-600">Restaurant payout</dt><dd className="tabular-nums">{f(order.restaurant_payout_cents)}</dd></div>
            <div className="flex justify-between"><dt className="text-night-600">Delivery revenue (fee − driver pay)</dt><dd className="tabular-nums">{f(order.delivery_revenue_cents)}</dd></div>
            <div className="flex justify-between font-semibold"><dt>Platform revenue</dt><dd className="tabular-nums">{f(order.platform_revenue_cents)}</dd></div>
            {delivery && <div className="flex justify-between"><dt className="text-night-600">Driver payout + tip</dt><dd className="tabular-nums">{f(delivery.driver_payout_cents + delivery.tip_cents)}</dd></div>}
          </dl>
        </Panel>
        <Panel title="Payment & delivery">
          <div className="space-y-3 p-5 text-sm">
            <p>{PAYMENT_METHOD_LABELS[order.payment_method]} · <PaymentPill status={order.payment_status} /></p>
            {payment && <p className="text-night-600">Provider: {payment.provider}{payment.provider_reference && ` · Ref ${payment.provider_reference}`}{payment.refunded_cents > 0 && ` · Refunded ${f(payment.refunded_cents)}`}</p>}
            {payment?.failure_reason && <p className="rounded-lg bg-ember-50 px-3 py-2 text-ember-700">{payment.failure_reason}</p>}
            {(order.payment_status === "paid" || order.payment_status === "partially_refunded") && <RefundButton orderId={order.id} />}
            <p className="border-t border-cream-200 pt-3"><strong>{order.contact_name}</strong> · {order.contact_phone}{order.contact_email && ` · ${order.contact_email}`}</p>
            {order.delivery_address && <p className="text-night-600">{[order.delivery_address.line1, order.delivery_address.line2, order.delivery_address.area].filter(Boolean).join(", ")}</p>}
            {delivery && <p>Delivery: <span className="capitalize">{delivery.status.replace("_", " ")}</span>{driver && ` · ${driver.full_name} (${driver.phone})`}</p>}
          </div>
        </Panel>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Items">
          <ul className="divide-y divide-cream-200 text-sm">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3 px-5 py-3">
                <span><strong>{i.quantity}×</strong> {i.name}{i.modifiers.length > 0 && <span className="block text-xs text-night-600">{i.modifiers.map((m) => m.name).join(", ")}</span>}</span>
                <span className="tabular-nums">{f(i.line_total_cents)}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Timeline & notifications">
          <ul className="space-y-2 p-5 text-sm">
            {history.map((h) => <li key={h.id}><span className="font-semibold">{statusLabel(h.status, order.fulfillment_type)}</span> · {t(h.created_at)}{h.note && <span className="text-night-600"> — {h.note}</span>}</li>)}
          </ul>
          <DataTable head={["Channel", "Template", "Status"]}>
            {notifications.map((n) => (
              <tr key={n.id}><Td>{n.channel}</Td><Td>{n.template}</Td><Td>{n.status}{n.error && <span className="block text-xs text-night-600">{n.error}</span>}</Td></tr>
            ))}
          </DataTable>
        </Panel>
      </div>
    </>
  );
}
