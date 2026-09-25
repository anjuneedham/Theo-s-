import { z } from "zod";
import { route, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/guards";
import { setDriverStatus } from "@/lib/services/drivers";

export const PATCH = route(async (request) => {
  const user = await requireUser(["driver", "admin"]);
  const { status } = await parseJson(request, z.object({ status: z.enum(["offline", "available", "busy"]) }));
  return { driver: await setDriverStatus(user, status) };
});
