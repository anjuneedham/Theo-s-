import { z } from "zod";
import { route, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/guards";
import { generatePayouts } from "@/lib/services/admin";

export const POST = route(async (request) => {
  await requireUser(["admin"]);
  const { period_end } = await parseJson(request, z.object({ period_end: z.iso.datetime() }));
  return { payouts: await generatePayouts(period_end) };
});
