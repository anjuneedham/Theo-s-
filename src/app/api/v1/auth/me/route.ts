import { route } from "@/lib/api/handler";
import { getSessionUser } from "@/lib/auth/session";

export const GET = route(async () => ({ user: await getSessionUser() }));
