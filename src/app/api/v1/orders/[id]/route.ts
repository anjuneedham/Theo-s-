import { route, HttpError } from "@/lib/api/handler";
import { getOrderForViewer, nextActionsFor } from "@/lib/services/orders";
import { getSessionUser } from "@/lib/auth/session";

type Ctx = { params: Promise<{ id: string }> };

/** Order detail for tracking. Guests authenticate with the tracking token. */
export const GET = route<Ctx>(async (request, { params }) => {
  const { id } = await params;
  const token = new URL(request.url).searchParams.get("token");
  const user = await getSessionUser();
  const result = await getOrderForViewer(id, { user, token });
  if (!result) throw new HttpError(404, "Order not found");
  const { detail, actor } = result;
  const { tracking_token: _t, idempotency_key: _i, ...order } = detail.order;
  void _t;
  void _i;
  const isStaff = actor === "admin" || actor === "restaurant";
  return {
    ...detail,
    order: isStaff
      ? order
      : { ...order, commission_cents: undefined, commission_rate_bps: undefined, restaurant_payout_cents: undefined, platform_revenue_cents: undefined, delivery_revenue_cents: undefined },
    actions: actor === "guest" ? (detail.order.status === "pending" ? ["cancelled"] : []) : nextActionsFor(detail.order, actor),
  };
});
