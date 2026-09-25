import { route, HttpError } from "@/lib/api/handler";
import { getHours, getMenu, getRestaurantBySlug, getZones } from "@/lib/services/catalog";
import { isOpenAt } from "@/lib/hours";

type Ctx = { params: Promise<{ slug: string }> };

/** Restaurant profile + full menu (used by the web app and future native apps). */
export const GET = route<Ctx>(async (_request, { params }) => {
  const { slug } = await params;
  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) throw new HttpError(404, "Restaurant not found");
  const [menu, hours, zones] = await Promise.all([getMenu(restaurant), getHours(restaurant.id), getZones(restaurant.id)]);
  const { commission_rate_bps: _c, plan_id: _p, ...publicRestaurant } = restaurant;
  void _c;
  void _p;
  return {
    restaurant: publicRestaurant,
    is_open: isOpenAt(hours, restaurant.timezone),
    hours,
    delivery_zones: zones.map((z) => ({ id: z.id, name: z.name, fee_cents: z.fee_cents, min_minutes: z.min_minutes, max_minutes: z.max_minutes, areas: z.areas, min_order_cents: z.min_order_cents })),
    menu,
  };
});
