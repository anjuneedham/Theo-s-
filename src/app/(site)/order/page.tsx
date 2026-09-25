import type { Metadata } from "next";
import { getAnchorRestaurant, getHours, getMenu, getZones } from "@/lib/services/catalog";
import { isOpenAt } from "@/lib/hours";
import { servedAreas } from "@/lib/zones";
import { MenuBrowser } from "@/components/menu/menu-browser";
import { FulfillmentPicker } from "@/components/menu/fulfillment-picker";
import { toCartRestaurant } from "@/lib/cart-restaurant";

export const metadata: Metadata = {
  title: "Order Online — Pickup or Delivery",
  description: "Order Theo's online for pickup or delivery. No service fee when you order direct. Cash or card on delivery.",
  alternates: { canonical: "/order" },
};

export default async function OrderPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { mode } = await searchParams;
  const restaurant = await getAnchorRestaurant();
  const [menu, hours, zones] = await Promise.all([getMenu(restaurant), getHours(restaurant.id), getZones(restaurant.id)]);
  const open = isOpenAt(hours, restaurant.timezone);
  return (
    <>
      <section className="border-b border-cream-200 bg-cream-50">
        <div className="container-page py-6 sm:py-8">
          <h1 className="text-3xl sm:text-4xl">Order from Theo&apos;s</h1>
          <FulfillmentPicker
            restaurant={toCartRestaurant(restaurant)}
            areas={servedAreas(zones).map((a) => a.area)}
            zones={zones.map((z) => ({ id: z.id, name: z.name, fee_cents: z.fee_cents, min_minutes: z.min_minutes, max_minutes: z.max_minutes, areas: z.areas, min_order_cents: z.min_order_cents }))}
            prepMinutes={restaurant.prep_time_minutes}
            acceptsDelivery={restaurant.accepts_delivery}
            acceptsPickup={restaurant.accepts_pickup}
            initialMode={mode === "pickup" || mode === "delivery" ? mode : undefined}
            address={[restaurant.address_line, restaurant.city].filter(Boolean).join(", ")}
          />
        </div>
      </section>
      <MenuBrowser restaurant={toCartRestaurant(restaurant)} sections={menu} isOpen={open} />
    </>
  );
}
