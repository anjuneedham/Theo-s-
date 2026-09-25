import { route, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/guards";
import { settingsSchema } from "@/lib/validation";
import { updateSettings } from "@/lib/services/admin";

export const PATCH = route(async (request) => {
  await requireUser(["admin"]);
  return { settings: await updateSettings(await parseJson(request, settingsSchema)) };
});
