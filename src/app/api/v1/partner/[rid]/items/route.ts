import { partnerRoute } from "@/lib/api/partner";
import { parseJson } from "@/lib/api/handler";
import { menuItemSchema } from "@/lib/validation";
import { createItem } from "@/lib/services/partner";

export const POST = partnerRoute(async ({ request, rid }) => ({ item: await createItem(rid, await parseJson(request, menuItemSchema)) }));
