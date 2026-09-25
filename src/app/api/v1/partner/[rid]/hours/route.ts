import { partnerRoute } from "@/lib/api/partner";
import { parseJson } from "@/lib/api/handler";
import { hoursSchema } from "@/lib/validation";
import { replaceHours } from "@/lib/services/partner";

export const PUT = partnerRoute(async ({ request, rid }) => ({ hours: await replaceHours(rid, await parseJson(request, hoursSchema)) }));
