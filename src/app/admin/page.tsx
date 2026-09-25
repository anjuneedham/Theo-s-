import Link from "next/link";
import { adminDashboard } from "@/lib/services/admin";
import { PageHeader } from "@/components/dashboard/shell";
import { StatCard, Panel, BarChart, DataTable, Td } from "@/components/dashboard/widgets";
import { StatusPill } from "@/components/ui/status-pill";
import { formatMoney } from "@/lib/money";

export default async function AdminOverview() {
  const d = await adminDashboard();
  const names = Object.fromEntries(d.restaurants.map((r) => [r.id, r.name]));
  return (
    <>
      <PageHeader title="Platform overview" description="Last 30 days unless noted. Revenue excludes cancelled orders." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard tone="dark" label="Today's orders" value={d.today.count} sub={`${formatMoney(d.today.grossCents)} gross · ${d.today.active} active`} />
        <StatCard label="Total orders (all time)" value={d.totalOrders.toLocaleString()} sub={`${d.month.count} in 30 days`} />
        <StatCard label="Gross order value" value={formatMoney(d.month.grossCents)} sub={`Avg ${formatMoney(d.month.avgOrderCents)}`} hint="Everything customers paid" />
        <StatCard tone="leaf" label="Platform revenue" value={formatMoney(d.month.platformRevenueCents)} sub="Commission + service fees + delivery margin − platform discounts" />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Restaurant payouts owed" value={formatMoney(d.partners.payoutCents)} sub="Partner restaurants (30d)" />
        <StatCard label="Theo's direct revenue" value={formatMoney(d.anchor.payoutCents)} sub={`${d.anchor.count} Theo's orders (food sales)`} />
        <StatCard label="Active restaurants" value={d.activeRestaurants} sub={d.pendingApplications ? <Link href="/admin/restaurants?status=pending" className="font-semibold text-ember-600 underline">{d.pendingApplications} pending application(s)</Link> : "No pending applications"} />
        <StatCard label="Active deliveries" value={d.activeDeliveries} sub={`${d.unassignedDeliveries} awaiting a driver · ${d.customers} customer accounts`} tone={d.unassignedDeliveries ? "ember" : "default"} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Gross order value, last 14 days"><BarChart data={d.daily} /></Panel>
        <Panel title="Revenue split (30 days)">
          <dl className="space-y-2.5 p-5 text-sm">
            {[
              ["Commission from partners", d.month.commissionCents],
              ["Customer service fees", d.month.serviceFeeCents],
              ["Delivery margin (fees − driver pay)", d.month.deliveryRevenueCents],
            ].map(([l, v]) => (
              <div key={l as string} className="flex justify-between"><dt className="text-night-600">{l}</dt><dd className="tabular-nums">{formatMoney(v as number)}</dd></div>
            ))}
            <div className="flex justify-between border-t border-cream-200 pt-2.5 font-bold"><dt>Platform revenue</dt><dd className="tabular-nums">{formatMoney(d.month.platformRevenueCents)}</dd></div>
            <div className="flex justify-between pt-2"><dt className="text-night-600">Restaurant payouts (incl. Theo&apos;s)</dt><dd className="tabular-nums">{formatMoney(d.month.payoutCents)}</dd></div>
          </dl>
          <p className="border-t border-cream-200 px-5 py-3 text-xs text-night-600">Figures are computed from each order&apos;s frozen revenue split. Rates are configured in Fees & settings.</p>
        </Panel>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Top restaurants (30d)">
          <DataTable head={["Restaurant", "Orders", "Gross", "Commission"]}>
            {d.topRestaurants.map((t) => (
              <tr key={t.restaurant.id}><Td className="font-semibold">{t.restaurant.name}</Td><Td>{t.orders}</Td><Td>{formatMoney(t.revenue)}</Td><Td>{formatMoney(t.commission)}</Td></tr>
            ))}
          </DataTable>
        </Panel>
        <Panel title="Top menu items (30d)">
          <DataTable head={["Item", "Restaurant", "Sold", "Revenue"]}>
            {d.topItems.map((t) => (
              <tr key={t.name + t.restaurant_id}><Td className="font-semibold">{t.name}</Td><Td>{names[t.restaurant_id]}</Td><Td>{t.quantity}</Td><Td>{formatMoney(t.revenue)}</Td></tr>
            ))}
          </DataTable>
        </Panel>
      </div>
      <Panel title="Recent orders" className="mt-6" action={<Link href="/admin/orders" className="text-sm font-semibold text-ember-600">All orders</Link>}>
        <DataTable head={["Order", "Restaurant", "Customer", "Type", "Total", "Status"]}>
          {d.recent.map((o) => (
            <tr key={o.id}>
              <Td><Link href={`/admin/orders/${o.id}`} className="font-semibold hover:underline">{o.order_number}</Link></Td>
              <Td>{names[o.restaurant_id]}</Td>
              <Td>{o.contact_name}</Td>
              <Td className="capitalize">{o.fulfillment_type}</Td>
              <Td>{formatMoney(o.total_cents, o.currency)}</Td>
              <Td><StatusPill status={o.status} fulfillment={o.fulfillment_type} /></Td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </>
  );
}
