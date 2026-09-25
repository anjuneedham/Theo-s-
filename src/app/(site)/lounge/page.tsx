import type { Metadata } from "next";
import { Music2, Wine, Users, Clock } from "lucide-react";
import { PageHero } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { DishImage } from "@/components/ui/dish-image";
import { getAnchorRestaurant, getHours, getMenu } from "@/lib/services/catalog";
import { formatMoney } from "@/lib/money";
import { formatHoursRow, DAY_NAMES } from "@/lib/hours";

export const metadata: Metadata = {
  title: "The Lounge — Cocktails, Music & Late Nights",
  description: "Theo's Lounge: handcrafted rum cocktails, selectors on the decks and late-night bites. Open until 2am on Fridays and Saturdays.",
  alternates: { canonical: "/lounge" },
};

export default async function LoungePage() {
  const r = await getAnchorRestaurant();
  const [menu, hours] = await Promise.all([getMenu(r), getHours(r.id)]);
  const cocktails = menu.find((s) => s.slug === "cocktails")?.items ?? [];
  const late = hours.filter((h) => !h.is_closed && h.closes_at < h.opens_at);
  return (
    <>
      <PageHero eyebrow="Restaurant & Lounge" title="After dark at Theo's">
        Low lights, good music and a bar built around Jamaican rum. The lounge is where dinner turns into a night out.
      </PageHero>
      <section className="container-page grid gap-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Wine, t: "Rum-forward bar", b: "House rum punch, sorrel sangria and Blue Mountain espresso martinis." },
          { icon: Music2, t: "Music every weekend", b: "Selectors Friday & Saturday, live acoustic sets on Sundays." },
          { icon: Users, t: "Private events", b: "Birthdays, after-work and celebrations — ask about reserving the lounge." },
          { icon: Clock, t: "Open late", b: late.length ? `Until ${formatHoursRow(late[0]).split("– ")[1]} on ${late.map((h) => DAY_NAMES[h.day_of_week]).join(" & ")}.` : "Late hours on weekends." },
        ].map((x) => (
          <div key={x.t} className="card p-6">
            <x.icon className="size-7 text-ember-500" />
            <h2 className="mt-4 font-sans text-lg font-bold">{x.t}</h2>
            <p className="mt-1 text-sm text-night-600">{x.b}</p>
          </div>
        ))}
      </section>
      {cocktails.length > 0 && (
        <section className="grain bg-night-950 py-16 text-cream-50 sm:py-20">
          <div className="container-page">
            <p className="eyebrow text-gold-400">Signature cocktails</p>
            <h2 className="mt-2 text-4xl">From the bar</h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {cocktails.map((c) => (
                <div key={c.id}>
                  <DishImage name={c.name} imageUrl={c.image_url} category="Cocktails" className="aspect-square rounded-3xl" />
                  <p className="mt-3 font-bold">{c.name}</p>
                  <p className="text-sm text-cream-200/70">{c.description}</p>
                  <p className="mt-1 text-sm font-semibold text-gold-400">{formatMoney(c.price_cents, r.currency)}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-xs text-cream-200/60">18+ only. Please drink responsibly.</p>
          </div>
        </section>
      )}
      <section className="container-page flex flex-col items-center gap-4 py-16 text-center">
        <h2 className="text-3xl">Planning a night out or a private event?</h2>
        <p className="max-w-xl text-night-600">Tell us the date and group size and we&apos;ll get back to you.</p>
        <div className="flex gap-3">
          <ButtonLink href="/contact?topic=events">Enquire about events</ButtonLink>
          <ButtonLink href="/events" variant="secondary">What&apos;s on</ButtonLink>
        </div>
      </section>
    </>
  );
}
