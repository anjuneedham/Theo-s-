import { getDb } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/shell";
import { PromotionEditor } from "@/components/dashboard/promotion-editor";

export default async function PromotionsPage({ params }: { params: Promise<{ rid: string }> }) {
  const { rid } = await params;
  const db = getDb();
  const r = (await db.get("restaurants", rid))!;
  const promotions = await db.list("promotions", { restaurant_id: rid }, { orderBy: "created_at", ascending: false });
  return (
    <>
      <PageHeader title="Promotions" description="Discount codes and automatic offers for your restaurant." />
      <PromotionEditor apiBase={`/api/v1/partner/${rid}/promotions`} promotions={promotions} currency={r.currency} fundedBy="restaurant" />
    </>
  );
}
