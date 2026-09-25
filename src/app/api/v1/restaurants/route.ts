import { route } from "@/lib/api/handler";
import { listMarketplace } from "@/lib/services/catalog";

/** Marketplace listing with optional filters: ?region=&category=&q=&area= */
export const GET = route(async (request) => {
  const p = new URL(request.url).searchParams;
  const listings = await listMarketplace({
    region: p.get("region") ?? undefined,
    category: p.get("category") ?? undefined,
    q: p.get("q") ?? undefined,
    area: p.get("area") ?? undefined,
  });
  return {
    restaurants: listings.map((l) => ({
      id: l.restaurant.id,
      slug: l.restaurant.slug,
      name: l.restaurant.name,
      tagline: l.restaurant.tagline,
      city: l.restaurant.city,
      logo_url: l.restaurant.logo_url,
      cover_url: l.restaurant.cover_url,
      rating_avg: l.restaurant.rating_avg,
      rating_count: l.restaurant.rating_count,
      categories: l.categories.map((c) => c.name),
      is_open: l.isOpen,
      delivery_from_cents: l.deliveryFromCents,
      eta_minutes: l.etaMinutes,
      sponsored: l.sponsored,
    })),
  };
});
