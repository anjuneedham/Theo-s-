import { getDb } from "@/lib/db";
import { daysAgoIso } from "@/lib/dates";
import { PageHeader } from "@/components/dashboard/shell";
import { DriverAdmin } from "@/components/dashboard/driver-admin";

export default async function AdminDrivers() {
  const db = getDb();
  const [drivers, active, restaurants, regions] = await Promise.all([
    db.list("drivers", {}, { orderBy: "created_at", ascending: false }),
    db.list("deliveries", { status: ["unassigned", "assigned", "picked_up"] }, { orderBy: "created_at" }),
    db.list("restaurants"),
    db.list("regions"),
  ]);
  const orders = active.length ? await db.list("orders", { id: active.map((d) => d.order_id) }) : [];
  const completedToday = await db.list("deliveries", { status: "delivered" }, { range: { column: "delivered_at", gte: daysAgoIso(1) } });
  return (
    <>
      <PageHeader title="Deliveries & drivers" description="Assign drivers to deliveries, approve new drivers and watch active jobs." />
      <DriverAdmin
        drivers={drivers.map((d) => ({ ...d, region: regions.find((r) => r.id === d.region_id)?.name ?? null, completedToday: completedToday.filter((c) => c.driver_id === d.id).length }))}
        deliveries={active.map((d) => {
          const o = orders.find((x) => x.id === d.order_id);
          return { delivery: d, order_number: o?.order_number ?? "", order_status: o?.status ?? "pending", area: o?.delivery_address?.area ?? "", restaurant: restaurants.find((r) => r.id === d.restaurant_id)?.name ?? "" };
        })}
      />
    </>
  );
}
