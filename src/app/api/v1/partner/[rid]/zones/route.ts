import { partnerRoute } from "@/lib/api/partner";
import { parseJson } from "@/lib/api/handler";
import { deliveryZoneSchema } from "@/lib/validation";
import { createZone } from "@/lib/services/partner";

export const POST = partnerRoute(async ({ request, rid }) => ({ zone: await createZone(rid, await parseJson(request, deliveryZoneSchema)) }));
