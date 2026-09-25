import { z } from "zod";
import { route, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/guards";
import { acceptDelivery, completeDelivery, pickUpDelivery } from "@/lib/services/drivers";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route<Ctx>(async (request, { params }) => {
  const user = await requireUser(["driver"]);
  const { id } = await params;
  const { action } = await parseJson(request, z.object({ action: z.enum(["accept", "pickup", "deliver"]) }));
  if (action === "accept") return { delivery: await acceptDelivery(user, id) };
  if (action === "pickup") return { order: await pickUpDelivery(user, id) };
  return { order: await completeDelivery(user, id) };
});
