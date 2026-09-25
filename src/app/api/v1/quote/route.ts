import { route, parseJson } from "@/lib/api/handler";
import { quoteSchema } from "@/lib/validation";
import { quoteOrder } from "@/lib/services/orders";

export const POST = route(
  async (request) => {
    const input = await parseJson(request, quoteSchema);
    return quoteOrder(input);
  },
  { rateLimit: { key: "quote", limit: 120, windowMs: 60_000 } },
);
