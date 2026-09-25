import { getDb } from "@/lib/db";
import { getMenu } from "@/lib/services/catalog";
import { PageHeader } from "@/components/dashboard/shell";
import { MenuEditor } from "@/components/dashboard/menu-editor";

export default async function MenuPage({ params }: { params: Promise<{ rid: string }> }) {
  const { rid } = await params;
  const r = (await getDb().get("restaurants", rid))!;
  const menu = await getMenu(r, { includeInactive: true });
  return (
    <>
      <PageHeader title="Menu" description="Changes appear on your live menu immediately. Mark items sold out when you run out." />
      <MenuEditor restaurantId={rid} currency={r.currency} sections={menu} />
    </>
  );
}
