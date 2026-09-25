import "server-only";
import { route } from "./handler";
import { requireUser, requireRestaurantAccess, type RestaurantAccess } from "../auth/guards";
import type { SessionUser } from "../auth/session";
import type { RestaurantMemberRole } from "../types";

type Params = { rid: string; id?: string };
type Ctx = { params: Promise<Params> };

/** Route wrapper for /api/v1/partner/[rid]/… — checks the caller manages that restaurant. */
export function partnerRoute(
  fn: (args: { request: Request; user: SessionUser; access: RestaurantAccess; rid: string; id?: string }) => Promise<unknown>,
  roles: RestaurantMemberRole[] = ["owner", "manager"],
) {
  return route<Ctx>(async (request, { params }) => {
    const { rid, id } = await params;
    const user = await requireUser(["restaurant", "admin", "customer"]);
    const access = await requireRestaurantAccess(user, rid, roles);
    return fn({ request, user, access, rid, id });
  });
}
