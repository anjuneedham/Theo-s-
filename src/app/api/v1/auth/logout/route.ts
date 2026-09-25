import { route } from "@/lib/api/handler";
import { signOut } from "@/lib/auth/session";

export const POST = route(async () => {
  await signOut();
  return { ok: true };
});
