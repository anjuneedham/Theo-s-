import type { Metadata } from "next";
import { MapPin, Phone, Mail, MessageCircle, Clock } from "lucide-react";
import { PageHero } from "@/components/ui/primitives";
import { ContactForm } from "@/components/site/contact-form";
import { getAnchorRestaurant, getHours } from "@/lib/services/catalog";
import { DAY_NAMES, formatHoursRow } from "@/lib/hours";

export const metadata: Metadata = {
  title: "Contact Theo's",
  description: "Call, WhatsApp or message Theo's Restaurant & Lounge in Kingston. Opening hours, location and enquiries for events and catering.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic } = await searchParams;
  const r = await getAnchorRestaurant();
  const hours = await getHours(r.id);
  const address = [r.address_line, r.area, r.city, "Jamaica"].filter(Boolean).join(", ");
  return (
    <>
      <PageHero eyebrow="Contact" title="We'd love to hear from you">Questions about an order, events, catering or partnerships — we usually reply within a few hours during opening times.</PageHero>
      <section className="container-page grid gap-8 py-16 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-6">
          <ul className="card space-y-5 p-6">
            <li className="flex gap-4"><MapPin className="size-5 shrink-0 text-ember-500" /><div><p className="font-bold">Visit</p><p className="text-sm text-night-600">{address}</p>{r.latitude != null && <a className="text-sm font-semibold text-ember-600 underline" href={`https://www.google.com/maps/search/?api=1&query=${r.latitude},${r.longitude}`} target="_blank" rel="noopener">Open in Maps</a>}</div></li>
            {r.phone && <li className="flex gap-4"><Phone className="size-5 shrink-0 text-ember-500" /><div><p className="font-bold">Call</p><a href={`tel:${r.phone.replace(/[^\d+]/g, "")}`} className="text-sm text-night-600 hover:text-ember-600">{r.phone}</a></div></li>}
            {r.whatsapp && <li className="flex gap-4"><MessageCircle className="size-5 shrink-0 text-ember-500" /><div><p className="font-bold">WhatsApp</p><a href={`https://wa.me/${r.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener" className="text-sm text-night-600 hover:text-ember-600">Message us on WhatsApp</a></div></li>}
            {r.email && <li className="flex gap-4"><Mail className="size-5 shrink-0 text-ember-500" /><div><p className="font-bold">Email</p><a href={`mailto:${r.email}`} className="text-sm text-night-600 hover:text-ember-600">{r.email}</a></div></li>}
          </ul>
          <div className="card p-6">
            <p className="flex items-center gap-2 font-bold"><Clock className="size-5 text-ember-500" /> Opening hours</p>
            <dl className="mt-3 space-y-1.5 text-sm">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <div key={d} className="flex justify-between"><dt className="text-night-600">{DAY_NAMES[d]}</dt><dd className="tabular-nums">{formatHoursRow(hours.find((h) => h.day_of_week === d))}</dd></div>
              ))}
            </dl>
          </div>
        </div>
        <div className="card p-6 sm:p-8">
          <h2 className="text-2xl">Send a message</h2>
          <ContactForm initialTopic={topic} />
        </div>
      </section>
    </>
  );
}
