import { SiteHeader, MobileTabBar } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { getSessionUser } from "@/lib/auth/session";
import { getAnchorRestaurant, getHours } from "@/lib/services/catalog";
import { RestaurantJsonLd } from "@/components/site/json-ld";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [user, restaurant] = await Promise.all([getSessionUser(), getAnchorRestaurant()]);
  const hours = await getHours(restaurant.id);
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-night-900 focus:px-4 focus:py-2 focus:text-cream-50">
        Skip to content
      </a>
      <SiteHeader user={user ? { name: user.full_name || user.email, role: user.role } : null} />
      <main id="main" className="min-h-[60vh]">
        {children}
      </main>
      <SiteFooter restaurant={restaurant} hours={hours} />
      <MobileTabBar />
      <RestaurantJsonLd restaurant={restaurant} hours={hours} />
    </>
  );
}
