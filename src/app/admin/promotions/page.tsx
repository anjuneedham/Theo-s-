import { getDb } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/shell";
import { PromotionEditor } from "@/components/dashboard/promotion-editor";

export default async function AdminPromotions() {
  const db = getDb();
  const [promotions, restaurants] = await Promise.all([db.list("promotions", {}, { orderBy: "created_at", ascending: false }), db.list("restaurants")]);
  return (
    <>
      <PageHeader title="Promotions" description="Platform-wide campaigns (funded by the platform) and every restaurant's own promotions." />
      <PromotionEditor apiBase="/api/v1/admin/promotions" promotions={promotions} currency="JMD" fundedBy="platform" restaurantNames={Object.fromEntries(restaurants.map((r) => [r.id, r.name]))} />
    </>
  );
}
