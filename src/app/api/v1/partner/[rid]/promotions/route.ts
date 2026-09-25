import { partnerRoute } from "@/lib/api/partner";
import { parseJson } from "@/lib/api/handler";
import { promotionSchema } from "@/lib/validation";
import { createPromotion } from "@/lib/services/partner";

// Restaurant-created promotions are funded by the restaurant.
export const POST = partnerRoute(async ({ request, rid }) => ({ promotion: await createPromotion(rid, await parseJson(request, promotionSchema), "restaurant") }));
