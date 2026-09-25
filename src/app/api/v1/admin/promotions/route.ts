import { route, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/guards";
import { promotionSchema } from "@/lib/validation";
import { createPromotion } from "@/lib/services/partner";

// Platform-wide promotions are funded by the platform.
export const POST = route(async (request) => {
  await requireUser(["admin"]);
  return { promotion: await createPromotion(null, await parseJson(request, promotionSchema), "platform") };
});
