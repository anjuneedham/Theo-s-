import { getDb } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/shell";
import { ReviewReplies } from "@/components/dashboard/review-replies";
import { StatCard } from "@/components/dashboard/widgets";

export default async function ReviewsPage({ params }: { params: Promise<{ rid: string }> }) {
  const { rid } = await params;
  const db = getDb();
  const r = (await db.get("restaurants", rid))!;
  const reviews = await db.list("reviews", { restaurant_id: rid }, { orderBy: "created_at", ascending: false });
  return (
    <>
      <PageHeader title="Customer reviews" description="Only customers with a delivered order can leave a review. Replies are public." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard tone="dark" label="Average rating" value={r.rating_count ? r.rating_avg.toFixed(1) : "—"} sub={`${r.rating_count} reviews`} />
      </div>
      <ReviewReplies restaurantId={rid} reviews={reviews} />
    </>
  );
}
