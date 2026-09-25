import type { Metadata } from "next";
import { Store, MapPin, Bike, BarChart3, ArrowRight } from "lucide-react";
import { PageHero, SectionHeading } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { getRegions, listMarketplace } from "@/lib/services/catalog";

export const metadata: Metadata = {
  title: "Theo's Delivery Network",
  description: "Theo's Delivery Network brings trusted online ordering and delivery to restaurants and neighbourhoods across Jamaica.",
  alternates: { canonical: "/network" },
};

export default async function NetworkPage() {
  const [regions, listings] = await Promise.all([getRegions(), listMarketplace()]);
  return (
    <>
      <PageHero eyebrow="Theo's Delivery Network" title="From one kitchen to a network of great local food">
        We built our own ordering and delivery for Theo&apos;s. Now we&apos;re opening it up so more Jamaican restaurants can reach customers directly — with fair fees and a delivery team that cares.
      </PageHero>
      <section className="container-page py-16">
        <ol className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {["Theo's Restaurant", "Online ordering", "Theo's delivery", "Delivery network", "More restaurants", "More areas"].map((s, i) => (
            <li key={s} className="card relative p-5">
              <span className="font-display text-3xl text-ember-500">{i + 1}</span>
              <p className="mt-2 font-semibold">{s}</p>
              {i < 2 && <span className="mt-2 inline-block rounded-full bg-leaf-50 px-2 py-0.5 text-xs font-bold text-leaf-700">Live</span>}
              {i === 2 && <span className="mt-2 inline-block rounded-full bg-leaf-50 px-2 py-0.5 text-xs font-bold text-leaf-700">Live in Kingston</span>}
              {i > 2 && <span className="mt-2 inline-block rounded-full bg-gold-300/40 px-2 py-0.5 text-xs font-bold text-gold-600">Onboarding</span>}
            </li>
          ))}
        </ol>
      </section>
      <section className="bg-cream-200/60 py-16">
        <div className="container-page grid gap-12 lg:grid-cols-2">
          <SectionHeading eyebrow="For customers" title="One app for the food you love">
            Browse restaurants by area and cuisine, order from any of them with the same trusted checkout, and track every order live.
          </SectionHeading>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Store, t: `${listings.length} restaurants`, b: "and growing" },
              { icon: MapPin, t: `${regions.length} regions`, b: regions.map((r) => r.name.split(" (")[0]).join(", ") },
              { icon: Bike, t: "Local drivers", b: "Tips go 100% to drivers" },
              { icon: BarChart3, t: "Transparent fees", b: "Always shown before you pay" },
            ].map((x) => (
              <div key={x.t} className="card p-5">
                <x.icon className="size-6 text-ember-500" />
                <p className="mt-3 font-bold">{x.t}</p>
                <p className="text-sm text-night-600">{x.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="container-page flex flex-wrap justify-center gap-3 py-16">
        <ButtonLink href="/restaurants" size="lg">Browse restaurants <ArrowRight className="size-4" /></ButtonLink>
        <ButtonLink href="/partners" size="lg" variant="secondary">List your restaurant</ButtonLink>
        <ButtonLink href="/drive" size="lg" variant="secondary">Drive with us</ButtonLink>
      </section>
    </>
  );
}
