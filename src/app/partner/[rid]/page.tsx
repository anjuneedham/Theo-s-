import Link from "next/link";
import { getDb } from "@/lib/db";
import { partnerDashboard } from "@/lib/services/partner";
import { resolveCommissionBps } from "@/lib/pricing";
import { getSettings } from "@/lib/services/catalog";
import { PageHeader } from "@/components/dashboard/shell";
import { StatCard, Panel, BarChart } from "@/components/dashboard/widgets";
import { StatusPill } from "@/components/ui/status-pill";
import { Stars } from "@/components/ui/primitives";
import { formatMoney, bpsToPercent } from "@/lib/money";

export default async function PartnerOverview({ params }: { params: Promise<{ rid: string }> }) {
  const { rid } = await params;
  const r = (await getDb().get("restaurants", rid))!;
  const d = await partnerDashboard(rid, r.timezone);
  const commissionBps = resolveCommissionBps(r, await getDb().list("subscription_plans"), await getSettings());
  const c = r.currency;
  return (
    <>
      <PageHeader title="Overview" description={`Today at ${r.name}`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard tone="dark" label="Today's orders" value={d.today.count} sub={`${d.today.active} active · ${d.today.completed} completed`} />
        <StatCard label="Today's revenue" value={formatMoney(d.today.grossCents, c)} sub={`Food sales ${formatMoney(d.today.foodSalesCents, c)}`} hint="Total paid by customers, excluding cancelled orders" />
        <StatCard label="Pending orders" value={d.pending.filter((o) => o.status === "pending").length} sub="Waiting to be accepted" tone={d.pending.some((o) => o.status === "pending") ? "ember" : "default"} />
        <StatCard label="Avg order value (30d)" value={formatMoney(d.month.avgOrderCents, c)} sub={`${d.month.count} orders in 30 days`} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Revenue, last 14 days">
          <BarChart data={d.daily} currency={c} />
        </Panel>
        <Panel title="30-day earnings">
          <dl className="space-y-3 p-5 text-sm">
            <Row label="Food sales (after restaurant discounts)" value={formatMoney(d.month.foodSalesCents, c)} />
            <Row label={`Platform commission (currently ${bpsToPercent(commissionBps)})`} value={`−${formatMoney(d.month.commissionCents, c)}`} />
            <Row label="Your payout" value={formatMoney(d.month.payoutCents, c)} strong />
            <Row label="Completed orders" value={String(d.month.completed)} />
            <Row label="Cancelled orders" value={String(d.month.cancelled)} />
          </dl>
          <p className="border-t border-cream-200 px-5 py-3 text-xs text-night-600">Delivery and service fees are collected by the platform and are not part of your payout.</p>
        </Panel>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Needs attention" action={<Link href={`/partner/${rid}/orders`} className="text-sm font-semibold text-ember-600">All orders</Link>} className="lg:col-span-1">
          {d.pending.length === 0 ? <p className="p-5 text-sm text-night-600">No active orders right now.</p> : (
            <ul className="divide-y divide-cream-200">
              {d.pending.slice(0, 6).map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <span><span className="font-bold">{o.order_number}</span> · {o.contact_name}</span>
                  <StatusPill status={o.status} fulfillment={o.fulfillment_type} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Popular items (30d)">
          {d.top.length === 0 ? <p className="p-5 text-sm text-night-600">No sales yet.</p> : (
            <ol className="divide-y divide-cream-200">
              {d.top.map((t, i) => (
                <li key={t.name} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <span><span className="mr-2 font-display text-lg text-ember-500">{i + 1}</span>{t.name}</span>
                  <span className="text-night-600">{t.quantity} sold</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
        <Panel title="Latest reviews" action={<Link href={`/partner/${rid}/reviews`} className="text-sm font-semibold text-ember-600">All</Link>}>
          {d.reviews.length === 0 ? <p className="p-5 text-sm text-night-600">No reviews yet. Customers can review delivered orders.</p> : (
            <ul className="divide-y divide-cream-200">
              {d.reviews.map((rv) => (
                <li key={rv.id} className="px-5 py-3 text-sm">
                  <Stars rating={rv.rating} />
                  <p className="mt-1 line-clamp-2 text-night-700">{rv.comment ?? "(no comment)"}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? "flex justify-between border-t border-cream-200 pt-3 text-base font-bold" : "flex justify-between"}>
      <dt className={strong ? "" : "text-night-600"}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
