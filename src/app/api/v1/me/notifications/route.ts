import { route } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/guards";
import { listNotifications, markNotificationsRead } from "@/lib/services/customers";

export const GET = route(async () => {
  const user = await requireUser();
  return { notifications: await listNotifications(user.id) };
});

export const PATCH = route(async () => {
  const user = await requireUser();
  return { marked: await markNotificationsRead(user.id) };
});
