import type { Metadata } from "next";
import { Check, LayoutDashboard, Bike, Wallet, Megaphone } from "lucide-react";
import { PageHero, SectionHeading } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { getDb } from "@/lib/db";
import { formatMoney, bpsToPercent } from "@/lib/money";

export const metadata: Metadata = {
  title: "Partner with Theo's — List Your Restaurant",
  description: "Join the Theo's Delivery Network: online ordering, delivery, a restaurant dashboard and weekly payouts for Jamaican restaurants.",
  alternates: { canonical: "/partners" },
};

export default async function PartnersPage() {
  const plans = (await getDb().list("subscription_plans", { is_active: true }, { orderBy: "sort_order" }));
  return (
    <>
      <PageHero eyebrow="For restaurants" title="Grow with the Theo's Delivery Network">
        Get your menu online, take pickup and delivery orders, and let our drivers handle the last mile. Built by a restaurant, for restaurants.
      </PageHero>
      <section className="container-page grid gap-5 py-16 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: LayoutDashboard, t: "Your own dashboard", b: "Accept orders, update your menu and hours, and see sales in real time." },
          { icon: Bike, t: "Delivery handled", b: "Set your own delivery zones and fees — our drivers pick up and deliver." },
          { icon: Wallet, t: "Clear payouts", b: "Every order shows the commission and your payout. Regular settlements." },
          { icon: Megaphone, t: "Get discovered", b: "Promotions, featured placements and marketplace listing." },
        ].map((x) => (
          <div key={x.t} className="card p-6">
            <x.icon className="size-7 text-ember-500" />
            <h2 className="mt-4 font-sans text-lg font-bold">{x.t}</h2>
            <p className="mt-1 text-sm text-night-600">{x.b}</p>
          </div>
        ))}
      </section>
      <section className="bg-cream-200/60 py-16">
        <div className="container-page">
          <SectionHeading eyebrow="Plans" title="Simple, transparent pricing" align="center">
            Indicative plans — final terms are agreed during onboarding.
          </SectionHeading>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {plans.map((p, i) => (
              <div key={p.id} className={i === 1 ? "rounded-[var(--radius-card)] bg-night-900 p-7 text-cream-50 shadow-[var(--shadow-lift)]" : "card p-7"}>
                <h3 className="text-2xl">{p.name}</h3>
                <p className={i === 1 ? "mt-1 text-sm text-cream-200/70" : "mt-1 text-sm text-night-600"}>{p.description}</p>
                <p className="mt-5 font-display text-4xl">{p.monthly_fee_cents ? formatMoney(p.monthly_fee_cents) : "J$0"}<span className="font-sans text-sm font-normal opacity-70">/month</span></p>
                <p className="mt-1 text-sm font-semibold">+ {bpsToPercent(p.commission_rate_bps)} commission per order</p>
                <ul className="mt-5 space-y-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2"><Check className="size-4 shrink-0 text-gold-500" /> {f}</li>
                  ))}
                </ul>
                <ButtonLink href={`/partners/apply?plan=${p.slug}`} variant={i === 1 ? "gold" : "dark"} className="mt-6 w-full">Apply for {p.name}</ButtonLink>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="container-page py-16">
        <h2 className="text-3xl">How it works</h2>
        <ol className="mt-6 grid gap-5 md:grid-cols-4">
          {["Apply online in 5 minutes", "We review and approve your restaurant", "Add your menu, hours and delivery zones", "Go live and start receiving orders"].map((s, i) => (
            <li key={s} className="card p-6">
              <span className="font-display text-3xl text-ember-500">{i + 1}</span>
              <p className="mt-2 font-semibold">{s}</p>
            </li>
          ))}
        </ol>
        <ButtonLink href="/partners/apply" size="lg" className="mt-10">Start your application</ButtonLink>
      </section>
    </>
  );
}
