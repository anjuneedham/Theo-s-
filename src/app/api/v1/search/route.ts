import { route } from "@/lib/api/handler";
import { searchMenuItems } from "@/lib/services/catalog";

export const GET = route(async (request) => {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const results = await searchMenuItems(q.slice(0, 60));
  return {
    results: results.map((r) => ({
      id: r.item.id,
      name: r.item.name,
      price_cents: r.item.price_cents,
      restaurant: { name: r.restaurant.name, slug: r.restaurant.slug },
    })),
  };
}, { rateLimit: { key: "search", limit: 60, windowMs: 60_000 } });
