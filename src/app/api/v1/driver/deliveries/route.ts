import { route } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/guards";
import { driverBoard } from "@/lib/services/drivers";

export const GET = route(async () => {
  const user = await requireUser(["driver", "admin"]);
  return driverBoard(user);
});
