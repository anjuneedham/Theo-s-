import { z } from "zod";
import { route, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/guards";
import { getDb } from "@/lib/db";
import { newId } from "@/lib/ids";

/** Paid featured / sponsored placements (a platform revenue stream). */
export const POST = route(async (request) => {
  await requireUser(["admin"]);
  const input = await parseJson(
    request,
    z.object({ restaurant_id: z.string().max(64), type: z.enum(["featured", "sponsored"]), starts_at: z.iso.datetime(), ends_at: z.iso.datetime(), fee_cents: z.number().int().min(0) }),
  );
  if (input.ends_at <= input.starts_at) throw Object.assign(new Error("End must be after start"), { status: 422 });
  const now = new Date().toISOString();
  const placement = await getDb().insert("placements", {
    id: newId(),
    region_id: null,
    ...input,
    status: input.starts_at <= now && input.ends_at >= now ? "active" : "scheduled",
    created_at: now,
  });
  if (input.type === "featured" && placement.status === "active") await getDb().update("restaurants", input.restaurant_id, { is_featured: true });
  return { placement };
});
