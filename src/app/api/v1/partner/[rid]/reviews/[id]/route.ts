import { z } from "zod";
import { partnerRoute } from "@/lib/api/partner";
import { parseJson } from "@/lib/api/handler";
import { replyToReview } from "@/lib/services/partner";

export const PATCH = partnerRoute(async ({ request, rid, id }) => {
  const { reply } = await parseJson(request, z.object({ reply: z.string().max(1000).nullable() }));
  return { review: await replyToReview(rid, id!, reply) };
});
