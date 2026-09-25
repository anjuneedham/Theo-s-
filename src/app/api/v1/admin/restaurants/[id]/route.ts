import { route, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/guards";
import { adminRestaurantSchema } from "@/lib/validation";
import { updateRestaurantAdmin } from "@/lib/services/admin";

type Ctx = { params: Promise<{ id: string }> };
export const PATCH = route<Ctx>(async (request, { params }) => {
  await requireUser(["admin"]);
  const { id } = await params;
  return { restaurant: await updateRestaurantAdmin(id, await parseJson(request, adminRestaurantSchema)) };
});
