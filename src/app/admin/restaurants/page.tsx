import { getDb } from "@/lib/db";
import { daysAgoIso } from "@/lib/dates";
import { getSettings } from "@/lib/services/catalog";
import { summarize } from "@/lib/services/partner";
import { PageHeader } from "@/components/dashboard/shell";
import { RestaurantAdmin } from "@/components/dashboard/restaurant-admin";

export default async function AdminRestaurants({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const db = getDb();
  const since = daysAgoIso(30);
  const [restaurants, plans, regions, orders, members, placements, settings] = await Promise.all([
    db.list("restaurants", {}, { orderBy: "created_at" }),
    db.list("subscription_plans", {}, { orderBy: "sort_order" }),
    db.list("regions", {}, { orderBy: "sort_order" }),
    db.list("orders", {}, { range: { column: "created_at", gte: since } }),
    db.list("restaurant_users"),
    db.list("placements", {}, { orderBy: "created_at", ascending: false }),
    getSettings(),
  ]);
  const owners = await db.list("profiles", { id: [...new Set(members.map((m) => m.user_id))] });
  const rows = restaurants
    .filter((r) => !status || r.status === status)
    .map((r) => {
      const owner = owners.find((p) => p.id === members.find((m) => m.restaurant_id === r.id && m.role === "owner")?.user_id);
      const s = summarize(orders.filter((o) => o.restaurant_id === r.id));
      return { restaurant: r, owner: owner ? { name: owner.full_name, email: owner.email } : null, orders30: s.count, gross30: s.grossCents, commission30: s.commissionCents };
    });
  return (
    <>
      <PageHeader title="Restaurants" description="Approve applications, set commission and plans, and manage featured placements." />
      <RestaurantAdmin
        rows={rows}
        plans={plans.map((p) => ({ id: p.id, name: p.name, commission_rate_bps: p.commission_rate_bps }))}
        regions={regions.map((r) => ({ id: r.id, name: r.name }))}
        defaultCommissionBps={settings.default_commission_bps}
        placements={placements}
        filter={status ?? "all"}
      />
    </>
  );
}
