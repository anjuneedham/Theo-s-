import { partnerRoute } from "@/lib/api/partner";
import { parseJson } from "@/lib/api/handler";
import { menuCategorySchema } from "@/lib/validation";
import { createCategory } from "@/lib/services/partner";

export const POST = partnerRoute(async ({ request, rid }) => ({ category: await createCategory(rid, await parseJson(request, menuCategorySchema)) }));
