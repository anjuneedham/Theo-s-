import { partnerRoute } from "@/lib/api/partner";
import { parseJson } from "@/lib/api/handler";
import { menuItemSchema } from "@/lib/validation";
import { deleteItem, updateItem } from "@/lib/services/partner";

// Staff may toggle availability (86 an item); owners/managers can edit everything.
export const PATCH = partnerRoute(async ({ request, rid, id, access }) => {
  const input = await parseJson(request, menuItemSchema.partial());
  if (access.role === "staff") {
    const keys = Object.keys(input).filter((k) => (input as Record<string, unknown>)[k] !== undefined);
    if (keys.some((k) => k !== "is_available")) throw Object.assign(new Error("Staff can only change availability"), { status: 403 });
  }
  return { item: await updateItem(rid, id!, input) };
}, ["owner", "manager", "staff"]);
export const DELETE = partnerRoute(async ({ rid, id }) => {
  await deleteItem(rid, id!);
  return { ok: true };
});
