import { partnerRoute } from "@/lib/api/partner";
import { parseJson } from "@/lib/api/handler";
import { promotionSchema } from "@/lib/validation";
import { updatePromotion } from "@/lib/services/partner";

export const PATCH = partnerRoute(async ({ request, rid, id }) => ({ promotion: await updatePromotion(rid, id!, await parseJson(request, promotionSchema.partial())) }));
