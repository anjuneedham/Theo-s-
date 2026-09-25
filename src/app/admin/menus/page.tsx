import Link from "next/link";
import { getDb } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/shell";
import { Panel, DataTable, Td } from "@/components/dashboard/widgets";

export default async function AdminMenus() {
  const db = getDb();
  const [restaurants, items, zones] = await Promise.all([db.list("restaurants", {}, { orderBy: "name" }), db.list("menu_items"), db.list("delivery_zones")]);
  return (
    <>
      <PageHeader title="Menus & delivery zones" description="Admins can edit any restaurant's menu, hours and zones using the same tools restaurants use." />
      <Panel>
        <DataTable head={["Restaurant", "Menu items", "Sold out", "Delivery zones", ""]}>
          {restaurants.map((r) => {
            const mine = items.filter((i) => i.restaurant_id === r.id);
            const z = zones.filter((x) => x.restaurant_id === r.id);
            return (
              <tr key={r.id}>
                <Td className="font-semibold">{r.name}<span className="block text-xs font-normal capitalize text-night-600">{r.status}</span></Td>
                <Td>{mine.length}</Td>
                <Td>{mine.filter((i) => !i.is_available).length}</Td>
                <Td>{z.filter((x) => x.is_active).length} active{z.length ? ` · ${z.map((x) => x.name).join(", ")}` : ""}</Td>
                <Td>
                  <div className="flex flex-wrap gap-3 text-sm font-semibold text-ember-600">
                    <Link href={`/partner/${r.id}/menu`}>Menu</Link>
                    <Link href={`/partner/${r.id}/zones`}>Zones</Link>
                    <Link href={`/partner/${r.id}/hours`}>Hours</Link>
                  </div>
                </Td>
              </tr>
            );
          })}
        </DataTable>
      </Panel>
    </>
  );
}
