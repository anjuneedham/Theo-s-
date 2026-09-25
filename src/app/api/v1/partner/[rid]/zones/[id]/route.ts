import { partnerRoute } from "@/lib/api/partner";
import { parseJson } from "@/lib/api/handler";
import { deliveryZoneSchema } from "@/lib/validation";
import { deleteZone, updateZone } from "@/lib/services/partner";

export const PATCH = partnerRoute(async ({ request, rid, id }) => ({ zone: await updateZone(rid, id!, await parseJson(request, deliveryZoneSchema)) }));
export const DELETE = partnerRoute(async ({ rid, id }) => {
  await deleteZone(rid, id!);
  return { ok: true };
});
