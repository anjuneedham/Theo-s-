import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { MapPin, Clock, Bike, Star, Phone } from "lucide-react";
import { getHours, getMenu, getPublishedReviews, getRestaurantBySlug, getZones } from "@/lib/services/catalog";
import { isOpenAt, formatHoursRow, DAY_NAMES } from "@/lib/hours";
import { MenuBrowser } from "@/components/menu/menu-browser";
import { toCartRestaurant } from "@/lib/cart-restaurant";
import { formatMoney } from "@/lib/money";
import { DishArt } from "@/components/ui/dish-art";
import { Stars } from "@/components/ui/primitives";
import { FavoriteButton } from "@/components/site/favorite-button";
import { getSessionUser } from "@/lib/auth/session";
import { favoriteIds } from "@/lib/services/customers";
import { restaurantSchema } from "@/components/site/json-ld";
import Image from "next/image";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const r = await getRestaurantBySlug(slug);
  if (!r) return { title: "Restaurant not found" };
  return {
    title: `${r.name} — Order Online${r.city ? ` in ${r.city}` : ""}`,
    description: r.tagline ?? r.description ?? undefined,
    alternates: { canonical: `/restaurants/${r.slug}` },
  };
}

export default async function RestaurantPage({ params }: Props) {
  const { slug } = await params;
  const r = await getRestaurantBySlug(slug);
  if (!r) notFound();
  if (r.is_anchor) redirect("/order");
  const [menu, hours, zones, reviews, user] = await Promise.all([getMenu(r), getHours(r.id), getZones(r.id), getPublishedReviews(r.id, 4), getSessionUser()]);
  const favs = await favoriteIds(user?.id);
  const open = isOpenAt(hours, r.timezone);
  const today = new Date().toLocaleString("en-US", { timeZone: r.timezone, weekday: "long" });
  const minFee = zones.length ? Math.min(...zones.map((z) => z.fee_cents)) : null;
  return (
    <>
      <section className="relative">
        <div className="relative h-48 overflow-hidden bg-night-900 sm:h-64">
          {r.cover_url ? <Image src={r.cover_url} alt="" fill className="object-cover opacity-80" priority /> : <DishArt name={menu[0]?.items[0]?.name ?? r.name} className="opacity-90" rounded={false} />}
          <div className="absolute inset-0 bg-gradient-to-t from-night-950/80 to-transparent" />
        </div>
        <div className="container-page relative -mt-16 sm:-mt-20">
          <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:p-7">
            <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-night-900 font-display text-3xl italic text-gold-400 ring-4 ring-white sm:size-24">
              {r.logo_url ? <Image src={r.logo_url} alt={`${r.name} logo`} width={96} height={96} className="size-full object-cover" /> : r.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-3xl sm:text-4xl">{r.name}</h1>
                <FavoriteButton restaurantId={r.id} initial={favs.restaurants.includes(r.id)} signedIn={Boolean(user)} />
              </div>
              {r.tagline && <p className="mt-1 text-night-600">{r.tagline}</p>}
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-night-700">
                <span className={open ? "font-semibold text-leaf-700" : "font-semibold text-night-600"}>{open ? "Open now" : "Closed"} · {formatHoursRow(hours.find((h) => DAY_NAMES[h.day_of_week] === today))}</span>
                {r.city && <span className="flex items-center gap-1"><MapPin className="size-4" /> {[r.area, r.city].filter(Boolean).join(", ")}</span>}
                {r.rating_count > 0 && <span className="flex items-center gap-1"><Star className="size-4 fill-gold-400 text-gold-400" /> {r.rating_avg.toFixed(1)} ({r.rating_count})</span>}
                {minFee !== null && <span className="flex items-center gap-1"><Bike className="size-4" /> Delivery from {formatMoney(minFee, r.currency)}</span>}
                <span className="flex items-center gap-1"><Clock className="size-4" /> ~{r.prep_time_minutes} min prep</span>
                {r.phone && <a href={`tel:${r.phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-1 hover:text-ember-600"><Phone className="size-4" /> Call</a>}
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="mt-6">
        <MenuBrowser restaurant={toCartRestaurant(r)} sections={menu} isOpen={open} />
      </div>
      {reviews.length > 0 && (
        <section className="container-page pb-24">
          <h2 className="text-2xl">Reviews</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {reviews.map((rv) => (
              <figure key={rv.id} className="card p-5">
                <Stars rating={rv.rating} />
                {rv.comment && <blockquote className="mt-2 text-night-700">{rv.comment}</blockquote>}
                <figcaption className="mt-2 text-xs text-night-600">— {rv.author_name}</figcaption>
                {rv.reply && <p className="mt-3 rounded-xl bg-cream-100 p-3 text-sm"><strong>{r.name}:</strong> {rv.reply}</p>}
              </figure>
            ))}
          </div>
        </section>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantSchema(r, hours, `/restaurants/${r.slug}`)).replace(/</g, "\\u003c") }} />
    </>
  );
}
