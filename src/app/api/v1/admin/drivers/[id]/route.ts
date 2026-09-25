import { z } from "zod";
import { route, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/guards";
import { approveDriver } from "@/lib/services/drivers";

type Ctx = { params: Promise<{ id: string }> };
export const PATCH = route<Ctx>(async (request, { params }) => {
  await requireUser(["admin"]);
  const { id } = await params;
  const { approved } = await parseJson(request, z.object({ approved: z.boolean() }));
  await approveDriver(id, approved);
  return { ok: true };
});
