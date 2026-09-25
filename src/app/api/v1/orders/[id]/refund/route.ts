import { z } from "zod";
import { route, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/guards";
import { refundOrder } from "@/lib/services/orders";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route<Ctx>(async (request, { params }) => {
  const user = await requireUser(["admin"]);
  const { id } = await params;
  const { amount_cents } = await parseJson(request, z.object({ amount_cents: z.number().int().positive().optional() }));
  return refundOrder(id, user, amount_cents);
});
