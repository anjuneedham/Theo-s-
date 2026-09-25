import { z } from "zod";
import { route, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/guards";
import { markPayout } from "@/lib/services/admin";

type Ctx = { params: Promise<{ id: string }> };
export const PATCH = route<Ctx>(async (request, { params }) => {
  await requireUser(["admin"]);
  const { id } = await params;
  const input = await parseJson(request, z.object({ status: z.enum(["pending", "processing", "paid", "failed"]), reference: z.string().max(120).nullish() }));
  return { payout: await markPayout(id, input.status, input.reference ?? null) };
});
