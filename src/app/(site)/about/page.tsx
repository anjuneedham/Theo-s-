import type { Metadata } from "next";
import { PageHero, SectionHeading } from "@/components/ui/primitives";
import { DishArt } from "@/components/ui/dish-art";
import { ButtonLink } from "@/components/ui/button";
import { getAnchorRestaurant } from "@/lib/services/catalog";

export const metadata: Metadata = {
  title: "About Theo's",
  description: "The story of Theo's Restaurant & Lounge — Jamaican cooking, warm hospitality and a lounge for good times.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const r = await getAnchorRestaurant();
  return (
    <>
      <PageHero eyebrow="Our story" title="Cooked with patience. Served with warmth.">{r.tagline}</PageHero>
      <section className="container-page grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-2">
        <div>
          <SectionHeading eyebrow="The kitchen" title="Jamaican classics, done properly">
            {r.description}
          </SectionHeading>
          <div className="prose-theos mt-6">
            <p>
              Our jerk is marinated for a full day before it meets the pimento wood. Oxtail braises low until it falls off the bone. Soups and stews are made fresh every morning, and our juices are pressed in-house.
            </p>
            <p>
              We keep the menu honest and seasonal — when lobster season closes, so does the lobster. What doesn&apos;t change is the welcome: whether you&apos;re here for a quick lunch box or a long Sunday brunch, you&apos;re family at Theo&apos;s.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4" aria-hidden>
          <div className="overflow-hidden rounded-3xl"><DishArt name="Jerk Chicken" className="aspect-[3/4]" /></div>
          <div className="mt-10 overflow-hidden rounded-3xl"><DishArt name="Escovitch Snapper" className="aspect-[3/4]" /></div>
        </div>
      </section>
      <section className="bg-cream-200/60 py-16 sm:py-20">
        <div className="container-page grid gap-6 md:grid-cols-3">
          {[
            ["Local first", "Produce from Jamaican farmers, Blue Mountain coffee and Jamaican rum behind the bar."],
            ["Made fresh daily", "Stews, soups, juices and sauces are made in-house every morning."],
            ["Community", "From dominoes night to Sunday brunch, Theo's is a place to gather."],
          ].map(([t, b]) => (
            <div key={t} className="card p-7">
              <h3 className="text-2xl">{t}</h3>
              <p className="mt-2 text-night-600">{b}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="container-page py-16 text-center">
        <h2 className="text-3xl">Come hungry.</h2>
        <div className="mt-6 flex justify-center gap-3">
          <ButtonLink href="/order">Order online</ButtonLink>
          <ButtonLink href="/contact" variant="secondary">Find us</ButtonLink>
        </div>
      </section>
    </>
  );
}
