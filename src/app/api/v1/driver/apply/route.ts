import { route, parseJson } from "@/lib/api/handler";
import { driverApplicationSchema } from "@/lib/validation";
import { requireUser } from "@/lib/auth/guards";
import { applyAsDriver } from "@/lib/services/drivers";

export const POST = route(
  async (request) => {
    const user = await requireUser();
    const input = await parseJson(request, driverApplicationSchema);
    return { driver: await applyAsDriver(user, input) };
  },
  { rateLimit: { key: "driver-apply", limit: 5, windowMs: 10 * 60_000 } },
);
