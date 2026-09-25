import { route, parseJson } from "@/lib/api/handler";
import { placeOrderSchema } from "@/lib/validation";
import { placeOrder } from "@/lib/services/orders";
import { getSessionUser } from "@/lib/auth/session";
import { requireUser } from "@/lib/auth/guards";
import { listCustomerOrders } from "@/lib/services/customers";

/** Place an order. Prices, fees and totals are computed server-side. */
export const POST = route(
  async (request) => {
    const input = await parseJson(request, placeOrderSchema);
    const user = await getSessionUser();
    const { order, redirect_url } = await placeOrder(input, user);
    return {
      order: { id: order.id, order_number: order.order_number, status: order.status, total_cents: order.total_cents, currency: order.currency },
      tracking_url: `/orders/${order.id}?token=${order.tracking_token}`,
      redirect_url,
    };
  },
  { rateLimit: { key: "orders", limit: 10, windowMs: 60_000 } },
);

/** The signed-in customer's order history. */
export const GET = route(async () => {
  const user = await requireUser();
  return { orders: await listCustomerOrders(user.id) };
});
