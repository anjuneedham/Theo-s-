import { getDb } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/shell";
import { PayoutAdmin } from "@/components/dashboard/payout-admin";

export default async function AdminPayouts() {
  const db = getDb();
  const [payouts, restaurants, unsettled] = await Promise.all([
    db.list("payouts", {}, { orderBy: "created_at", ascending: false, limit: 200 }),
    db.list("restaurants"),
    db.list("orders", { status: "delivered", payout_id: null }),
  ]);
  return (
    <>
      <PageHeader title="Payouts & settlement" description="Generate settlements for completed orders, then record the bank transfer reference when paid." />
      <PayoutAdmin payouts={payouts} names={Object.fromEntries(restaurants.map((r) => [r.id, r.name]))} unsettledCount={unsettled.length} />
    </>
  );
}
