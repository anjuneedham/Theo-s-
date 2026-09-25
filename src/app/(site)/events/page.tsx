import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { PageHero, EmptyState } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { DishArt } from "@/components/ui/dish-art";
import { getAnchorRestaurant, getUpcomingEvents } from "@/lib/services/catalog";
import { formatMoney } from "@/lib/money";
import { EventsJsonLd } from "@/components/site/json-ld";

export const metadata: Metadata = {
  title: "Events at Theo's Lounge",
  description: "Upcoming events at Theo's Restaurant & Lounge — lounge nights, Sunday brunch with live music, dominoes and more.",
  alternates: { canonical: "/events" },
};

export default async function EventsPage() {
  const r = await getAnchorRestaurant();
  const events = await getUpcomingEvents(r.id, 20);
  return (
    <>
      <PageHero eyebrow="What's on" title="Events at Theo's">Weekly nights and special occasions. Follow us on social for last-minute announcements.</PageHero>
      <section className="container-page py-16">
        {events.length === 0 ? (
          <EmptyState icon={<CalendarDays className="size-6" />} title="No upcoming events posted">Check back soon.</EmptyState>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => {
              const d = new Date(e.starts_at);
              return (
                <article key={e.id} className="card overflow-hidden">
                  <div className="relative">
                    <DishArt name={e.title.includes("Brunch") ? "Sunday Brunch Platter" : "Theo's Rum Punch"} category={e.title.includes("Brunch") ? "" : "Cocktails"} className="aspect-[16/9]" />
                    <div className="absolute left-4 top-4 rounded-2xl bg-cream-50 px-3 py-2 text-center shadow">
                      <p className="text-xs font-bold uppercase text-ember-600">{d.toLocaleString("en-US", { month: "short", timeZone: r.timezone })}</p>
                      <p className="font-display text-2xl leading-none">{d.toLocaleString("en-US", { day: "numeric", timeZone: r.timezone })}</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-sm font-semibold text-clay-500">{d.toLocaleString("en-US", { weekday: "long", hour: "numeric", minute: "2-digit", timeZone: r.timezone })}</p>
                    <h2 className="mt-1 text-2xl">{e.title}</h2>
                    {e.description && <p className="mt-2 text-sm text-night-600">{e.description}</p>}
                    <p className="mt-4 text-sm font-semibold">{e.cover_charge_cents ? `Cover ${formatMoney(e.cover_charge_cents, r.currency)}` : "Free entry"}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        <div className="mt-12 text-center">
          <ButtonLink href="/contact?topic=events" variant="secondary">Book a private event</ButtonLink>
        </div>
      </section>
      <EventsJsonLd restaurant={r} events={events} />
    </>
  );
}
