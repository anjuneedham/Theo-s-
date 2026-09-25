import { route, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/guards";
import { promotionSchema } from "@/lib/validation";
import { updatePromotion } from "@/lib/services/partner";

type Ctx = { params: Promise<{ id: string }> };
export const PATCH = route<Ctx>(async (request, { params }) => {
  await requireUser(["admin"]);
  const { id } = await params;
  return { promotion: await updatePromotion(null, id, await parseJson(request, promotionSchema.partial())) };
});
