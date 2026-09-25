import type { Metadata } from "next";
import { PageHero } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { FaqJsonLd } from "@/components/site/json-ld";

export const metadata: Metadata = {
  title: "FAQ — Ordering, Delivery & Payments",
  description: "Answers to common questions about ordering from Theo's: delivery areas, fees, payment, order tracking, allergies and the Theo's Delivery Network.",
  alternates: { canonical: "/faq" },
};

const FAQ = [
  { group: "Ordering", items: [
    { q: "How do I order?", a: "Open the Order Online page, choose delivery or pickup, add dishes to your cart and check out. You can order as a guest or sign in to save your details." },
    { q: "Can I schedule an order for later?", a: "Yes. At checkout choose “Schedule for later” and pick a time when we're open, up to 7 days ahead." },
    { q: "Can I change or cancel my order?", a: "You can cancel from your order page while it's still pending. Once the kitchen confirms it, please call us and we'll do our best to help." },
    { q: "Do I need an account?", a: "No — guest checkout is available. An account lets you save addresses, see your order history and reorder in one tap." },
  ]},
  { group: "Delivery", items: [
    { q: "Where do you deliver?", a: "We deliver across several zones in Kingston & St. Andrew. See the Delivery page for the full list of areas, fees and times." },
    { q: "How much is delivery?", a: "The fee depends on your zone and is shown before you pay. There is no service fee when you order directly from Theo's." },
    { q: "How long does delivery take?", a: "Most orders arrive in 50–75 minutes depending on your zone and how busy we are. Your order page shows a live estimate." },
  ]},
  { group: "Payment", items: [
    { q: "How can I pay?", a: "Cash or card when your order is delivered or collected. Online card payment will be added soon." },
    { q: "Are prices inclusive of tax?", a: "Yes, menu prices include GCT. Your receipt shows the tax included." },
    { q: "How do promo codes work?", a: "Enter the code at checkout. The discount is checked and applied before you place your order." },
  ]},
  { group: "Food & drink", items: [
    { q: "Do you cater for allergies?", a: "Add allergies to the special instructions for each dish and we'll do our best. Our kitchen handles nuts, gluten, shellfish and dairy, so we can't guarantee a dish is allergen-free." },
    { q: "Do you have vegan or vegetarian options?", a: "Yes — look for the Vegan and Veg labels on the menu, including Rasta Pasta and most sides." },
    { q: "Can I order alcohol for delivery?", a: "Yes, for customers 18 and over. The driver will ask for valid ID on delivery." },
  ]},
  { group: "Theo's Delivery Network", items: [
    { q: "What is the Theo's Delivery Network?", a: "It's our ordering and delivery platform, now opening to partner restaurants across Jamaica. Browse participating restaurants on the Restaurants page." },
    { q: "How can my restaurant join?", a: "Apply on the Partner with us page. We'll review your application and help you set up your menu." },
  ]},
];

export default function FaqPage() {
  return (
    <>
      <PageHero eyebrow="Help" title="Frequently asked questions" />
      <section className="container-page max-w-3xl py-16">
        {FAQ.map((g) => (
          <div key={g.group} className="mb-10">
            <h2 className="text-2xl">{g.group}</h2>
            <div className="mt-4 divide-y divide-cream-200 rounded-3xl border border-cream-200 bg-white">
              {g.items.map((i) => (
                <details key={i.q} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                    {i.q}
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-cream-200 text-lg transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-night-600">{i.a}</p>
                </details>
              ))}
            </div>
          </div>
        ))}
        <div className="rounded-3xl bg-cream-200 p-6 text-center">
          <p className="font-semibold">Still have a question?</p>
          <ButtonLink href="/contact" className="mt-4">Contact us</ButtonLink>
        </div>
      </section>
      <FaqJsonLd items={FAQ.flatMap((g) => g.items)} />
    </>
  );
}
