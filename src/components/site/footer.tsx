import Link from "next/link";
import { MapPin, Phone, Mail, MessageCircle } from "lucide-react";
import { Instagram, Facebook } from "@/components/ui/social-icons";
import type { OperatingHours, Restaurant } from "@/lib/types";
import { DAY_NAMES, formatHoursRow } from "@/lib/hours";
import { Logo } from "./logo";

const COLUMNS = [
  {
    title: "Theo's",
    links: [
      ["/menu", "Full menu"],
      ["/order", "Order online"],
      ["/specials", "Specials"],
      ["/lounge", "The Lounge"],
      ["/events", "Events"],
      ["/about", "Our story"],
    ],
  },
  {
    title: "Delivery network",
    links: [
      ["/delivery", "Delivery areas & fees"],
      ["/restaurants", "Browse restaurants"],
      ["/network", "About the network"],
      ["/partners", "Partner with us"],
      ["/drive", "Drive with us"],
    ],
  },
  {
    title: "Help",
    links: [
      ["/contact", "Contact us"],
      ["/faq", "FAQ"],
      ["/account/orders", "Track an order"],
      ["/privacy", "Privacy policy"],
      ["/terms", "Terms of service"],
    ],
  },
];

export function SiteFooter({ restaurant, hours }: { restaurant: Restaurant; hours: OperatingHours[] }) {
  const ordered = [1, 2, 3, 4, 5, 6, 0].map((d) => hours.find((h) => h.day_of_week === d));
  return (
    <footer className="grain bg-night-950 pb-24 text-cream-200 md:pb-0">
      <div className="container-page grid gap-12 py-16 lg:grid-cols-[1.3fr_2fr]">
        <div>
          <Logo light />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-cream-200/70">{restaurant.description}</p>
          <ul className="mt-6 space-y-3 text-sm">
            <li className="flex gap-3">
              <MapPin className="size-4 shrink-0 text-gold-400" />
              <span>{[restaurant.address_line, restaurant.area, restaurant.city, "Jamaica"].filter(Boolean).join(", ")}</span>
            </li>
            {restaurant.phone && (
              <li className="flex gap-3">
                <Phone className="size-4 shrink-0 text-gold-400" />
                <a href={`tel:${restaurant.phone.replace(/[^\d+]/g, "")}`} className="hover:text-cream-50">{restaurant.phone}</a>
              </li>
            )}
            {restaurant.whatsapp && (
              <li className="flex gap-3">
                <MessageCircle className="size-4 shrink-0 text-gold-400" />
                <a href={`https://wa.me/${restaurant.whatsapp.replace(/\D/g, "")}`} className="hover:text-cream-50" rel="noopener" target="_blank">WhatsApp us</a>
              </li>
            )}
            {restaurant.email && (
              <li className="flex gap-3">
                <Mail className="size-4 shrink-0 text-gold-400" />
                <a href={`mailto:${restaurant.email}`} className="hover:text-cream-50">{restaurant.email}</a>
              </li>
            )}
          </ul>
          <div className="mt-6 flex gap-2">
            {restaurant.social_instagram && (
              <a href={restaurant.social_instagram} aria-label="Instagram" className="grid size-10 place-items-center rounded-full border border-cream-50/15 hover:bg-cream-50/10" rel="noopener" target="_blank">
                <Instagram className="size-4" />
              </a>
            )}
            {restaurant.social_facebook && (
              <a href={restaurant.social_facebook} aria-label="Facebook" className="grid size-10 place-items-center rounded-full border border-cream-50/15 hover:bg-cream-50/10" rel="noopener" target="_blank">
                <Facebook className="size-4" />
              </a>
            )}
          </div>
        </div>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map((c) => (
            <div key={c.title}>
              <h3 className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-gold-400">{c.title}</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {c.links.map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="text-cream-200/75 transition hover:text-cream-50">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h3 className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-gold-400">Opening hours</h3>
            <dl className="mt-4 space-y-1.5 text-sm">
              {ordered.map((h, i) => (
                <div key={i} className="flex justify-between gap-3">
                  <dt className="text-cream-200/60">{DAY_NAMES[[1, 2, 3, 4, 5, 6, 0][i]].slice(0, 3)}</dt>
                  <dd className="text-right tabular-nums">{formatHoursRow(h)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
      <div className="border-t border-cream-50/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-cream-200/50 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Theo&apos;s Restaurant &amp; Lounge. All rights reserved.</p>
          <p>Please drink responsibly. Alcohol is only sold to persons 18 and over.</p>
        </div>
      </div>
    </footer>
  );
}
