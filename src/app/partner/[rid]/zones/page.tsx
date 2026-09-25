import { getDb } from "@/lib/db";
import { getZones } from "@/lib/services/catalog";
import { PageHeader } from "@/components/dashboard/shell";
import { ZoneEditor } from "@/components/dashboard/zone-editor";

export default async function ZonesPage({ params }: { params: Promise<{ rid: string }> }) {
  const { rid } = await params;
  const r = (await getDb().get("restaurants", rid))!;
  const zones = await getZones(rid, false);
  return (
    <>
      <PageHeader title="Delivery zones" description="Each zone has its own fee, minimum order and delivery time. Customers pick their area at checkout; with GPS, the smallest matching radius is used." />
      <ZoneEditor restaurantId={rid} currency={r.currency} zones={zones} hasLocation={r.latitude != null} />
    </>
  );
}
