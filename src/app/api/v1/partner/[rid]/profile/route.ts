import { partnerRoute } from "@/lib/api/partner";
import { parseJson } from "@/lib/api/handler";
import { restaurantProfileSchema } from "@/lib/validation";
import { updateProfile } from "@/lib/services/partner";

export const PATCH = partnerRoute(async ({ request, rid }) => ({ restaurant: await updateProfile(rid, await parseJson(request, restaurantProfileSchema)) }));
