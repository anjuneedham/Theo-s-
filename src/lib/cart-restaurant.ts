import type { Restaurant } from "./types";
import type { CartRestaurant } from "@/components/cart/cart-store";

export function toCartRestaurant(r: Restaurant): CartRestaurant {
  return { id: r.id, slug: r.slug, name: r.name, currency: r.currency, is_anchor: r.is_anchor };
}
