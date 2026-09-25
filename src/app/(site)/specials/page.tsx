import type { Metadata } from "next";
import Link from "next/link";
import { BadgePercent } from "lucide-react";
import { PageHero } from "@/components/ui/primitives";
import { DishImage } from "@/components/ui/dish-image";
import { ButtonLink } from "@/components/ui/button";
import { getActivePromotions, getAnchorRestaurant, getMenu } from "@/lib/services/catalog";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = {
  title: "Specials & Offers",
  description: "This week's specials at Theo's, plus direct-order offers you won't find on other apps.",
  alternates: { canonical: "/specials" },
};

export default async function SpecialsPage() {
  const r = await getAnchorRestaurant();
  const [menu, promos] = await Promise.all([getMenu(r), getActivePromotions(r.id)]);
  const specials = menu.find((s) => s.slug === "specials");
  const featured = menu.flatMap((s) => s.items.filter((i) => i.is_featured && s.slug !== "specials").map((i) => ({ i, s: s.name }))).slice(0, 6);
  return (
    <>
      <PageHero eyebrow="Specials" title="This week at Theo's">{specials?.description ?? "Chef's specials and offers for ordering direct."}</PageHero>
      {promos.length > 0 && (
        <section className="container-page grid gap-5 py-12 md:grid-cols-2">
          {promos.map((p) => (
            <div key={p.id} className="flex gap-5 rounded-3xl bg-ember-500 p-7 text-white">
              <BadgePercent className="size-10 shrink-0 text-gold-300" />
              <div>
                <h2 className="text-2xl">{p.title}</h2>
                {p.description && <p className="mt-1 text-sm text-white/85">{p.description}</p>}
                {p.code && <p className="mt-4 inline-block rounded-full bg-white px-4 py-1.5 text-sm font-bold tracking-wider text-ember-700">{p.code}</p>}
              </div>
            </div>
          ))}
        </section>
      )}
      {specials && specials.items.length > 0 && (
        <section className="container-page py-8">
          <h2 className="text-3xl">Chef&apos;s specials</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {specials.items.map((i) => (
              <Link key={i.id} href="/order#cat-specials" className="card group flex flex-col overflow-hidden sm:flex-row">
                <DishImage name={i.name} imageUrl={i.image_url} category="Specials" className="aspect-[16/10] sm:aspect-auto sm:w-56" />
                <div className="flex-1 p-6">
                  <h3 className="font-sans text-xl font-bold">{i.name}</h3>
                  <p className="mt-2 text-sm text-night-600">{i.description}</p>
                  <p className="mt-4 font-semibold">{formatMoney(i.price_cents, r.currency)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
      <section className="container-page py-12 pb-20">
        <h2 className="text-3xl">Always popular</h2>
        <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-6">
          {featured.map(({ i, s }) => (
            <Link key={i.id} href="/order" className="group">
              <DishImage name={i.name} imageUrl={i.image_url} category={s} className="aspect-square rounded-2xl" />
              <p className="mt-2 text-sm font-bold">{i.name}</p>
              <p className="text-xs text-night-600">{formatMoney(i.price_cents, r.currency)}</p>
            </Link>
          ))}
        </div>
        <ButtonLink href="/order" className="mt-10">Order now</ButtonLink>
      </section>
    </>
  );
}
