import { z } from "zod";
import { route, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/guards";
import { getDb } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };
export const PATCH = route<Ctx>(async (request, { params }) => {
  await requireUser(["admin"]);
  const { id } = await params;
  const { status } = await parseJson(request, z.object({ status: z.enum(["new", "read", "archived"]) }));
  return { message: await getDb().update("contact_messages", id, { status }) };
});
