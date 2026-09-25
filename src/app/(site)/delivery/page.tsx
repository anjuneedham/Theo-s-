import type { Metadata } from "next";
import { Clock, MapPin, ShieldCheck, Bike, Store } from "lucide-react";
import { PageHero } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { getAnchorRestaurant, getZones } from "@/lib/services/catalog";
import { formatMoney } from "@/lib/money";
import { AreaChecker } from "@/components/site/area-checker";

export const metadata: Metadata = {
  title: "Delivery — Areas, Fees & Times",
  description: "Theo's delivers across Kingston & St. Andrew. See delivery zones, fees and estimated times, and check whether we deliver to your area.",
  alternates: { canonical: "/delivery" },
};

export default async function DeliveryPage() {
  const restaurant = await getAnchorRestaurant();
  const zones = await getZones(restaurant.id);
  return (
    <>
      <PageHero eyebrow="Delivery" title="Theo's, delivered hot to your door">
        Choose your area at checkout and you&apos;ll see the exact delivery fee and time before you pay. Pay cash or card when your food arrives.
      </PageHero>
      <section className="container-page grid gap-10 py-16 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <h2 className="text-3xl">Delivery zones</h2>
          <p className="mt-2 text-night-600">Prep time is about {restaurant.prep_time_minutes} minutes, plus travel time for your zone.</p>
          <div className="mt-6 overflow-hidden rounded-3xl border border-cream-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-cream-100 text-xs uppercase tracking-wider text-night-600">
                <tr>
                  <th className="px-5 py-3">Zone & areas</th>
                  <th className="px-5 py-3 text-right">Fee</th>
                  <th className="hidden px-5 py-3 text-right sm:table-cell">Min. order</th>
                  <th className="px-5 py-3 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {zones.map((z) => (
                  <tr key={z.id}>
                    <td className="px-5 py-4">
                      <p className="font-bold">{z.name}</p>
                      <p className="mt-0.5 text-night-600">{z.areas.join(", ")}</p>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold tabular-nums">{formatMoney(z.fee_cents, restaurant.currency)}</td>
                    <td className="hidden px-5 py-4 text-right tabular-nums sm:table-cell">{formatMoney(z.min_order_cents, restaurant.currency)}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-right tabular-nums">{z.min_minutes + restaurant.prep_time_minutes}–{z.max_minutes + restaurant.prep_time_minutes} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-night-600">Times are estimates and can be longer during peak hours and bad weather.</p>
        </div>
        <div className="space-y-6">
          <AreaChecker areas={zones.flatMap((z) => z.areas.map((a) => ({ area: a, zone: z.name, fee: formatMoney(z.fee_cents, restaurant.currency), time: `${z.min_minutes + restaurant.prep_time_minutes}–${z.max_minutes + restaurant.prep_time_minutes} min` })))} />
          <ul className="card space-y-5 p-6">
            {[
              { icon: Clock, t: "Live tracking", b: "Follow your order from the kitchen to your gate." },
              { icon: ShieldCheck, t: "Pay on arrival", b: "Cash or card on delivery. We never charge before your order is confirmed." },
              { icon: MapPin, t: "Saved addresses", b: "Save home and work for one-tap checkout next time." },
              { icon: Bike, t: "Our own drivers", b: "Deliveries are handled by Theo's drivers — tips go 100% to them." },
            ].map((x) => (
              <li key={x.t} className="flex gap-4">
                <x.icon className="size-5 shrink-0 text-ember-500" />
                <div>
                  <p className="font-bold">{x.t}</p>
                  <p className="text-sm text-night-600">{x.b}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="container-page pb-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-leaf-700 p-8 text-cream-50 sm:flex-row sm:items-center sm:p-10">
          <div>
            <p className="eyebrow text-gold-400">Coming soon to more areas</p>
            <h2 className="mt-2 text-3xl">The Theo&apos;s Delivery Network</h2>
            <p className="mt-2 max-w-xl text-cream-200/80">We&apos;re expanding delivery to partner restaurants in Spanish Town, Portmore, Montego Bay, Ocho Rios and beyond.</p>
          </div>
          <ButtonLink href="/network" variant="gold"><Store className="size-4" /> Learn more</ButtonLink>
        </div>
      </section>
    </>
  );
}
