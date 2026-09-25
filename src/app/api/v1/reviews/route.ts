import { route, parseJson } from "@/lib/api/handler";
import { reviewSchema } from "@/lib/validation";
import { requireUser } from "@/lib/auth/guards";
import { createReview } from "@/lib/services/customers";

export const POST = route(
  async (request) => {
    const user = await requireUser();
    const input = await parseJson(request, reviewSchema);
    return { review: await createReview(user, input) };
  },
  { rateLimit: { key: "reviews", limit: 10, windowMs: 60_000 } },
);
