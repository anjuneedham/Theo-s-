import { z } from "zod";
import { route, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/guards";
import { assignDriver } from "@/lib/services/drivers";

type Ctx = { params: Promise<{ id: string }> };
export const PATCH = route<Ctx>(async (request, { params }) => {
  await requireUser(["admin"]);
  const { id } = await params;
  const { driver_id } = await parseJson(request, z.object({ driver_id: z.string().max(64).nullable() }));
  return { delivery: await assignDriver(id, driver_id) };
});
