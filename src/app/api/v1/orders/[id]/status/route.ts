import { route, parseJson } from "@/lib/api/handler";
import { statusUpdateSchema } from "@/lib/validation";
import { updateOrderStatus } from "@/lib/services/orders";
import { getSessionUser } from "@/lib/auth/session";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route<Ctx>(
  async (request, { params }) => {
    const { id } = await params;
    const token = new URL(request.url).searchParams.get("token");
    const input = await parseJson(request, statusUpdateSchema);
    const user = await getSessionUser();
    const order = await updateOrderStatus(id, input.status, user, { note: input.note, token });
    return { order: { id: order.id, status: order.status, payment_status: order.payment_status } };
  },
  { rateLimit: { key: "status", limit: 60, windowMs: 60_000 } },
);
