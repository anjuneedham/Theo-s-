import { route, parseJson } from "@/lib/api/handler";
import { contactSchema } from "@/lib/validation";
import { saveContactMessage } from "@/lib/services/applications";
import { getAnchorRestaurant } from "@/lib/services/catalog";
import { dispatch } from "@/lib/notifications";

export const POST = route(
  async (request) => {
    const input = await parseJson(request, contactSchema);
    const restaurant = await getAnchorRestaurant();
    await saveContactMessage(input, restaurant.id);
    if (restaurant.email) {
      await dispatch({
        userId: null,
        orderId: null,
        template: "contact_message",
        title: `New ${input.topic} enquiry from ${input.name}`,
        body: `${input.message}\n\nReply to: ${input.email}${input.phone ? ` / ${input.phone}` : ""}`,
        email: restaurant.email,
        channels: ["email"],
      }).catch(() => undefined);
    }
    return { ok: true };
  },
  { rateLimit: { key: "contact", limit: 5, windowMs: 10 * 60_000 } },
);
