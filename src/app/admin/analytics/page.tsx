import { analyticsReport } from "@/lib/services/admin";
import { PageHeader } from "@/components/dashboard/shell";
import { StatCard, Panel, DataTable, Td } from "@/components/dashboard/widgets";
import { formatMoney } from "@/lib/money";

const pct = (n: number | null) => (n === null ? "—" : `${Math.round(n * 100)}%`);

export default async function AdminAnalytics({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { days } = await searchParams;
  const d = await analyticsReport(Math.min(365, Math.max(1, Number(days) || 30)));
  const top = Math.max(1, ...d.funnel.map((f) => f.sessions));
  return (
    <>
      <PageHeader title="Analytics" description={`Last ${d.days} days. Storefront events are first-party and cookie-free.`} actions={
        <div className="flex gap-1.5">{[7, 30, 90].map((n) => <a key={n} href={`?days=${n}`} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${d.days === n ? "bg-night-900 text-cream-50" : "bg-white ring-1 ring-cream-300"}`}>{n}d</a>)}</div>
      } />
      {d.trackingNote && <p className="mb-4 rounded-xl bg-cream-200 px-4 py-2 text-sm">{d.trackingNote}</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard tone="dark" label="Orders" value={d.summary.count} sub={`${d.summary.cancelled} cancelled (${pct(d.summary.count ? d.summary.cancelled / d.summary.count : 0)})`} />
        <StatCard label="Average order value" value={formatMoney(d.summary.avgOrderCents)} />
        <StatCard label="Repeat customers" value={pct(d.repeatRate)} sub={`${d.repeatCustomers} of ${d.customersTotal} ordered more than once`} />
        <StatCard label="Checkout conversion" value={pct(d.checkoutStarted ? d.funnel[4].sessions / Math.max(1, d.funnel[3].sessions) : null)} sub="Orders ÷ checkouts started" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Ordering funnel (unique sessions)">
          <ul className="space-y-3 p-5">
            {d.funnel.map((f, i) => (
              <li key={f.step}>
                <div className="flex justify-between text-sm"><span className="font-semibold">{f.step}</span><span className="tabular-nums">{f.sessions}{i > 0 && d.funnel[i - 1].sessions > 0 && <span className="ml-2 text-night-600">{pct(f.sessions / d.funnel[i - 1].sessions)}</span>}</span></div>
                <div className="mt-1 h-2.5 rounded-full bg-cream-200"><div className="h-full rounded-full bg-ember-500" style={{ width: `${(f.sessions / top) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
          <p className="border-t border-cream-200 px-5 py-3 text-xs text-night-600">Page views: {d.pageViews} · Product views: {d.productViews} · Add to cart: {d.addToCart}</p>
        </Panel>
        <Panel title="Delivery performance">
          <div className="grid grid-cols-3 gap-4 p-5">
            <StatCard label="Avg. order → delivered" value={d.avgDeliveryMinutes !== null ? `${d.avgDeliveryMinutes}m` : "—"} />
            <StatCard label="On time" value={pct(d.onTimeRate)} sub="vs. promised estimate" />
            <StatCard label="Avg. prep time" value={d.avgPrepMinutes !== null ? `${d.avgPrepMinutes}m` : "—"} sub="confirmed → ready" />
          </div>
        </Panel>
      </div>
      <Panel title="Restaurant performance" className="mt-6">
        <DataTable head={["Restaurant", "Orders", "Gross", "Avg order", "Cancel rate", "Rating"]}>
          {d.restaurantPerformance.map((r) => (
            <tr key={r.restaurant.id}>
              <Td className="font-semibold">{r.restaurant.name}</Td>
              <Td>{r.orders}</Td>
              <Td>{formatMoney(r.revenueCents)}</Td>
              <Td>{formatMoney(r.avgOrderCents)}</Td>
              <Td className={r.cancelRate > 0.1 ? "font-semibold text-ember-700" : ""}>{pct(r.cancelRate)}</Td>
              <Td>{r.rating !== null ? `${r.rating.toFixed(1)} (${r.reviews})` : "—"}</Td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </>
  );
}
