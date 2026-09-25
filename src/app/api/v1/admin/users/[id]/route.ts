import { z } from "zod";
import { route, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/guards";
import { setUserRole } from "@/lib/services/admin";

type Ctx = { params: Promise<{ id: string }> };
export const PATCH = route<Ctx>(async (request, { params }) => {
  const admin = await requireUser(["admin"]);
  const { id } = await params;
  const { role } = await parseJson(request, z.object({ role: z.enum(["customer", "restaurant", "driver", "admin"]) }));
  return { profile: await setUserRole(admin.id, id, role) };
});
