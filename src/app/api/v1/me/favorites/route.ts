import { z } from "zod";
import { route, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/guards";
import { listFavorites, toggleFavorite } from "@/lib/services/customers";

export const GET = route(async () => {
  const user = await requireUser();
  return listFavorites(user.id);
});

/** Toggle a favourite restaurant or dish. */
export const POST = route(async (request) => {
  const user = await requireUser();
  const input = await parseJson(request, z.object({ restaurant_id: z.string().max(64).nullish(), menu_item_id: z.string().max(64).nullish() }));
  return toggleFavorite(user, input);
});
