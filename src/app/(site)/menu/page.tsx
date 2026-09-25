import type { Metadata } from "next";
import { getAnchorRestaurant, getHours, getMenu } from "@/lib/services/catalog";
import { isOpenAt } from "@/lib/hours";
import { MenuBrowser } from "@/components/menu/menu-browser";
import { MenuJsonLd } from "@/components/site/json-ld";
import { toCartRestaurant } from "@/lib/cart-restaurant";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Menu — Jerk Chicken, Oxtail, Seafood & Cocktails",
  description:
    "The full Theo's menu: breakfast, jerk chicken, oxtail, curry goat, escovitch fish, sides, fresh juices, rum cocktails and desserts. Order online for pickup or delivery.",
  alternates: { canonical: "/menu" },
};

export default async function MenuPage() {
  const restaurant = await getAnchorRestaurant();
  const [menu, hours] = await Promise.all([getMenu(restaurant), getHours(restaurant.id)]);
  const count = menu.reduce((n, s) => n + s.items.length, 0);
  return (
    <>
      <section className="grain relative overflow-hidden bg-night-900 text-cream-50">
        <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-ember-500/25 blur-3xl" aria-hidden />
        <div className="container-page relative flex flex-wrap items-end justify-between gap-6 py-12 sm:py-16">
          <div>
            <p className="eyebrow text-gold-400">Theo&apos;s kitchen & bar</p>
            <h1 className="mt-2 text-5xl sm:text-6xl">The Menu</h1>
            <p className="mt-3 max-w-xl text-cream-200/80">
              {count} dishes and drinks across {menu.length} categories. Tap any dish to customise it and add it to your order.
            </p>
          </div>
          <ButtonLink href="/order" variant="gold">Start an order</ButtonLink>
        </div>
      </section>
      <MenuBrowser restaurant={toCartRestaurant(restaurant)} sections={menu} isOpen={isOpenAt(hours, restaurant.timezone)} layout="menu" />
      <MenuJsonLd restaurant={restaurant} menu={menu} />
    </>
  );
}
