import { route, parseJson } from "@/lib/api/handler";
import { profileSchema } from "@/lib/validation";
import { requireUser } from "@/lib/auth/guards";
import { updateProfile } from "@/lib/services/customers";

export const PATCH = route(async (request) => {
  const user = await requireUser();
  const input = await parseJson(request, profileSchema);
  return { profile: await updateProfile(user, input) };
});
