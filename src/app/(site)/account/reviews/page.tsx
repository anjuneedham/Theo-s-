import { MessageSquare } from "lucide-react";
import { requirePageUser } from "@/lib/auth/guards";
import { listCustomerReviews } from "@/lib/services/customers";
import { EmptyState, Stars } from "@/components/ui/primitives";

export default async function ReviewsPage() {
  const user = await requirePageUser("/account/reviews");
  const reviews = await listCustomerReviews(user.id);
  if (!reviews.length) {
    return <EmptyState icon={<MessageSquare className="size-6" />} title="No reviews yet">After an order is delivered you can rate it from the order page.</EmptyState>;
  }
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {reviews.map(({ review, restaurant }) => (
        <li key={review.id} className="card p-5">
          <p className="font-bold">{restaurant?.name}</p>
          <Stars rating={review.rating} className="mt-1" />
          {review.comment && <p className="mt-2 text-sm text-night-700">{review.comment}</p>}
          {review.reply && <p className="mt-3 rounded-xl bg-cream-100 p-3 text-sm"><strong>Reply:</strong> {review.reply}</p>}
        </li>
      ))}
    </ul>
  );
}
