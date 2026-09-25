import type { Metadata } from "next";
import Link from "next/link";
import { Search, Store, Clock, Bike, Star } from "lucide-react";
import { getRegions, getRestaurantCategories, listMarketplace } from "@/lib/services/catalog";
import { formatMoney } from "@/lib/money";
import { DishImage } from "@/components/ui/dish-image";
import { EmptyState } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { FavoriteButton } from "@/components/site/favorite-button";
import { getSessionUser } from "@/lib/auth/session";
import { favoriteIds } from "@/lib/services/customers";

export const metadata: Metadata = {
  title: "Restaurants on the Theo's Delivery Network",
  description: "Order from Theo's and partner restaurants across Jamaica. Filter by area and cuisine, see delivery fees and times.",
  alternates: { canonical: "/restaurants" },
};

export default async function RestaurantsPage({ searchParams }: { searchParams: Promise<{ region?: string; category?: string; q?: string }> }) {
  const sp = await searchParams;
  const [listings, regions, categories, user] = await Promise.all([listMarketplace(sp), getRegions(), getRestaurantCategories(), getSessionUser()]);
  const favs = await favoriteIds(user?.id);
  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
    const s = p.toString();
    return `/restaurants${s ? `?${s}` : ""}`;
  };
  return (
    <>
      <section className="grain relative overflow-hidden bg-leaf-700 text-cream-50">
        <div className="pointer-events-none absolute -right-20 -top-20 size-96 rounded-full bg-gold-500/20 blur-3xl" aria-hidden />
        <div className="container-page relative py-12 sm:py-16">
          <p className="eyebrow text-gold-400">Theo&apos;s Delivery Network</p>
          <h1 className="mt-2 text-4xl sm:text-5xl">Restaurants near you</h1>
          <form className="mt-6 flex max-w-2xl flex-col gap-2 sm:flex-row" action="/restaurants">
            {sp.region && <input type="hidden" name="region" value={sp.region} />}
            {sp.category && <input type="hidden" name="category" value={sp.category} />}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-night-600" />
              <input name="q" defaultValue={sp.q} placeholder="Search restaurants, cuisines or towns" aria-label="Search restaurants" className="field-input h-12 pl-11" />
            </div>
            <button className="h-12 rounded-full bg-gold-400 px-6 font-semibold text-night-950 hover:bg-gold-300">Search</button>
          </form>
        </div>
      </section>
      <section className="container-page py-8 pb-24">
        <div className="space-y-3">
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" aria-label="Filter by area">
            <Link href={href({ region: undefined })} className={cn("shrink-0 rounded-full px-4 py-2 text-sm font-semibold ring-1", !sp.region ? "bg-night-900 text-cream-50 ring-night-900" : "bg-white ring-cream-300")}>All areas</Link>
            {regions.map((r) => (
              <Link key={r.id} href={href({ region: r.slug })} className={cn("shrink-0 rounded-full px-4 py-2 text-sm font-semibold ring-1", sp.region === r.slug ? "bg-night-900 text-cream-50 ring-night-900" : "bg-white ring-cream-300")}>{r.name}</Link>
            ))}
          </div>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" aria-label="Filter by cuisine">
            <Link href={href({ category: undefined })} className={cn("shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold", !sp.category ? "bg-ember-500 text-white" : "bg-cream-200 text-night-700")}>All cuisines</Link>
            {categories.map((c) => (
              <Link key={c.id} href={href({ category: c.slug })} className={cn("shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold", sp.category === c.slug ? "bg-ember-500 text-white" : "bg-cream-200 text-night-700")}>{c.name}</Link>
            ))}
          </div>
        </div>
        <p className="mt-6 text-sm text-night-600">{listings.length} restaurant{listings.length === 1 ? "" : "s"}</p>
        {listings.length === 0 ? (
          <div className="mt-4">
            <EmptyState icon={<Store className="size-6" />} title="No restaurants match yet">We&apos;re adding partners across Jamaica. Try another area or cuisine.</EmptyState>
          </div>
        ) : (
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <article key={l.restaurant.id} className="group relative">
                <Link href={l.restaurant.is_anchor ? "/order" : `/restaurants/${l.restaurant.slug}`} className="block">
                  <div className="relative">
                    <DishImage name={l.categories[0]?.name === "Patties & Bakery" ? "Beef Patty" : l.restaurant.is_anchor ? "Jerk Chicken" : l.categories[0]?.name === "Vegan & Ital" ? "Ital Stew" : "Fried Fish"} imageUrl={l.restaurant.cover_url} className={cn("aspect-[16/10] rounded-3xl transition group-hover:shadow-[var(--shadow-lift)]", !l.isOpen && "grayscale-[60%]")} />
                    <div className="absolute left-3 top-3 flex gap-1.5">
                      {l.restaurant.is_anchor && <span className="rounded-full bg-night-900 px-2.5 py-1 text-xs font-bold text-gold-400">Theo&apos;s Original</span>}
                      {l.sponsored && <span className="rounded-full bg-cream-50 px-2.5 py-1 text-xs font-bold">Sponsored</span>}
                      {l.restaurant.is_featured && !l.restaurant.is_anchor && <span className="rounded-full bg-gold-400 px-2.5 py-1 text-xs font-bold text-night-950">Featured</span>}
                      {!l.isOpen && <span className="rounded-full bg-cream-50 px-2.5 py-1 text-xs font-bold">Closed</span>}
                    </div>
                  </div>
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-sans text-lg font-bold">{l.restaurant.name}</h2>
                      <p className="truncate text-sm text-night-600">{l.categories.map((c) => c.name).join(" · ")} · {l.restaurant.city}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-night-700">
                    {l.restaurant.rating_count > 0 && <span className="flex items-center gap-1"><Star className="size-4 fill-gold-400 text-gold-400" /> {l.restaurant.rating_avg.toFixed(1)} ({l.restaurant.rating_count})</span>}
                    {l.etaMinutes && <span className="flex items-center gap-1"><Clock className="size-4" /> {l.etaMinutes[0]}–{l.etaMinutes[1]} min</span>}
                    {l.deliveryFromCents !== null ? <span className="flex items-center gap-1"><Bike className="size-4" /> from {formatMoney(l.deliveryFromCents, l.restaurant.currency)}</span> : <span>Pickup only</span>}
                  </div>
                </Link>
                <FavoriteButton className="absolute right-3 top-3" restaurantId={l.restaurant.id} initial={favs.restaurants.includes(l.restaurant.id)} signedIn={Boolean(user)} />
              </article>
            ))}
          </div>
        )}
        <div className="mt-16 flex flex-col items-start justify-between gap-4 rounded-3xl bg-cream-200 p-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl">Own a restaurant?</h2>
            <p className="text-night-600">Reach new customers with Theo&apos;s ordering and delivery.</p>
          </div>
          <Link href="/partners" className="rounded-full bg-night-900 px-6 py-3 font-semibold text-cream-50">Partner with us</Link>
        </div>
      </section>
    </>
  );
}
