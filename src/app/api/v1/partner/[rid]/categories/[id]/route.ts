import { partnerRoute } from "@/lib/api/partner";
import { parseJson } from "@/lib/api/handler";
import { menuCategorySchema } from "@/lib/validation";
import { deleteCategory, updateCategory } from "@/lib/services/partner";

export const PATCH = partnerRoute(async ({ request, rid, id }) => ({ category: await updateCategory(rid, id!, await parseJson(request, menuCategorySchema.partial())) }));
export const DELETE = partnerRoute(async ({ rid, id }) => {
  await deleteCategory(rid, id!);
  return { ok: true };
});
