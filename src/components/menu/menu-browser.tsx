"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Flame, Leaf, Clock, X, Star } from "lucide-react";
import type { MenuItemWithOptions, MenuSection } from "@/lib/services/catalog";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";
import { formatTime } from "@/lib/hours";
import { DishImage } from "@/components/ui/dish-image";
import { ItemSheet } from "./item-sheet";
import { CartBar } from "@/components/cart/cart-bar";
import type { CartRestaurant } from "@/components/cart/cart-store";
import { track } from "@/lib/analytics-client";

export interface MenuBrowserProps {
  restaurant: CartRestaurant;
  sections: MenuSection[];
  isOpen: boolean;
  /** Offset for the sticky tabs (px) below the site header. */
  stickyTop?: string;
  layout?: "order" | "menu";
}

export function MenuBrowser({ restaurant, sections, isOpen, stickyTop = "top-16 lg:top-20", layout = "order" }: MenuBrowserProps) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(sections[0]?.slug ?? "");
  const [selected, setSelected] = useState<{ item: MenuItemWithOptions; section: MenuSection } | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    track("menu_view", { restaurant_id: restaurant.id });
  }, [restaurant.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((s) => ({ ...s, items: s.items.filter((i) => i.name.toLowerCase().includes(q) || (i.description ?? "").toLowerCase().includes(q)) }))
      .filter((s) => s.items.length > 0);
  }, [query, sections]);

  // Scroll-spy: highlight the category currently in view.
  useEffect(() => {
    const els = filtered.map((s) => document.getElementById(`cat-${s.slug}`)).filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id.replace("cat-", ""));
      },
      { rootMargin: "-140px 0px -60% 0px" },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [filtered]);

  useEffect(() => {
    const tab = tabsRef.current?.querySelector<HTMLElement>(`[data-slug="${active}"]`);
    tab?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [active]);

  function open(item: MenuItemWithOptions, section: MenuSection) {
    setSelected({ item, section });
    track("product_view", { restaurant_id: restaurant.id, properties: { item_id: item.id, name: item.name } });
  }

  const featured = layout === "order" && !query ? sections.flatMap((s) => s.items.filter((i) => i.is_featured && i.is_available && s.servingNow).map((i) => ({ item: i, section: s }))).slice(0, 8) : [];

  return (
    <div className="pb-28 md:pb-16">
      <div className={cn("sticky z-20 border-b border-cream-200 bg-cream-100/95 backdrop-blur-lg", stickyTop)}>
        <div className="container-page flex items-center gap-3 py-3">
          <div className="relative hidden w-64 shrink-0 md:block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-night-600/60" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the menu"
              aria-label="Search the menu"
              className="h-10 w-full rounded-full border border-cream-300 bg-white pl-10 pr-9 text-sm focus:border-ember-500 focus:outline-none focus:ring-4 focus:ring-ember-500/15"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-night-600" aria-label="Clear search">
                <X className="size-4" />
              </button>
            )}
          </div>
          <div ref={tabsRef} className="no-scrollbar -mx-4 flex flex-1 gap-2 overflow-x-auto px-4 md:mx-0 md:px-0" role="tablist" aria-label="Menu categories">
            {filtered.map((s) => (
              <a
                key={s.id}
                href={`#cat-${s.slug}`}
                data-slug={s.slug}
                role="tab"
                aria-selected={active === s.slug}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
                  active === s.slug ? "bg-night-900 text-cream-50" : "bg-white text-night-700 ring-1 ring-cream-300 hover:ring-night-600/30",
                )}
              >
                {s.name}
              </a>
            ))}
          </div>
        </div>
        <div className="container-page pb-3 md:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-night-600/60" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dishes, drinks…"
              aria-label="Search the menu"
              className="h-10 w-full rounded-full border border-cream-300 bg-white pl-10 pr-9 text-sm focus:border-ember-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {!isOpen && (
        <div className="container-page mt-5">
          <div className="flex items-start gap-3 rounded-2xl bg-gold-300/30 px-4 py-3 text-sm text-night-800">
            <Clock className="mt-0.5 size-4 shrink-0 text-gold-600" />
            <p>
              <strong>{restaurant.name} is closed right now.</strong> You can still build your order and schedule it for a time when we&apos;re open.
            </p>
          </div>
        </div>
      )}

      {featured.length > 0 && (
        <section className="container-page mt-8" aria-labelledby="popular">
          <h2 id="popular" className="flex items-center gap-2 text-2xl">
            <Star className="size-5 fill-gold-400 text-gold-400" /> Most loved
          </h2>
          <div className="no-scrollbar -mx-4 mt-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
            {featured.map(({ item, section }) => (
              <button key={item.id} onClick={() => open(item, section)} className="group w-60 shrink-0 snap-start text-left">
                <DishImage name={item.name} imageUrl={item.image_url} category={section.name} className="aspect-[4/3] rounded-2xl transition group-hover:shadow-[var(--shadow-lift)]" />
                <p className="mt-2.5 font-semibold text-night-900">{item.name}</p>
                <p className="text-sm text-night-600">{formatMoney(item.price_cents, restaurant.currency)}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="container-page">
        {filtered.length === 0 && (
          <p className="py-16 text-center text-night-600">
            No dishes match “{query}”.{" "}
            <button className="font-semibold text-ember-600 underline" onClick={() => setQuery("")}>
              Clear search
            </button>
          </p>
        )}
        {filtered.map((section) => (
          <section key={section.id} id={`cat-${section.slug}`} className="scroll-mt-40 pt-10" aria-labelledby={`h-${section.slug}`}>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 id={`h-${section.slug}`} className="text-3xl">{section.name}</h2>
                {section.description && <p className="mt-1 text-sm text-night-600">{section.description}</p>}
              </div>
              {!section.servingNow && section.available_from && section.available_until && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-200 px-3 py-1 text-xs font-semibold text-night-700">
                  <Clock className="size-3.5" /> Served {formatTime(section.available_from)}–{formatTime(section.available_until)}
                </span>
              )}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
              {section.items.map((item) => (
                <MenuItemCard key={item.id} item={item} section={section} currency={restaurant.currency} onOpen={() => open(item, section)} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {selected && (
        <ItemSheet
          restaurant={restaurant}
          item={selected.item}
          section={selected.section}
          orderable={selected.section.servingNow && selected.item.is_available}
          onClose={() => setSelected(null)}
        />
      )}
      <CartBar />
    </div>
  );
}

function MenuItemCard({ item, section, currency, onOpen }: { item: MenuItemWithOptions; section: MenuSection; currency: string; onOpen: () => void }) {
  const unavailable = !item.is_available;
  const notServing = !section.servingNow;
  return (
    <button
      onClick={onOpen}
      className={cn(
        "group flex w-full gap-4 rounded-2xl border border-cream-200 bg-white p-3 text-left shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] lg:flex-col lg:p-0",
        (unavailable || notServing) && "opacity-70",
      )}
      aria-label={`${item.name}, ${formatMoney(item.price_cents, currency)}${unavailable ? ", sold out" : ""}`}
    >
      <div className="min-w-0 flex-1 lg:order-2 lg:px-5 lg:pb-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-sans text-[1.02rem] font-bold leading-snug text-night-900">{item.name}</h3>
          <span className="hidden shrink-0 font-semibold tabular-nums text-night-900 lg:block">{formatMoney(item.price_cents, currency)}</span>
        </div>
        {item.description && <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-night-600">{item.description}</p>}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="font-semibold tabular-nums text-night-900 lg:hidden">{formatMoney(item.price_cents, currency)}</span>
          {item.is_featured && <span className="rounded-full bg-gold-300/40 px-2 py-0.5 text-[0.7rem] font-bold text-gold-600">Popular</span>}
          {item.spice_level > 0 && (
            <span className="inline-flex items-center text-ember-500" aria-label={`Spice level ${item.spice_level} of 3`}>
              {Array.from({ length: item.spice_level }).map((_, i) => (
                <Flame key={i} className="size-3.5 fill-current" />
              ))}
            </span>
          )}
          {(item.dietary_tags.includes("vegan") || item.dietary_tags.includes("vegetarian")) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-leaf-50 px-2 py-0.5 text-[0.7rem] font-bold text-leaf-700">
              <Leaf className="size-3" />
              {item.dietary_tags.includes("vegan") ? "Vegan" : "Veg"}
            </span>
          )}
          {item.dietary_tags.includes("alcohol") && <span className="rounded-full bg-cream-200 px-2 py-0.5 text-[0.7rem] font-bold text-night-700">18+</span>}
          {unavailable && <span className="rounded-full bg-night-900 px-2 py-0.5 text-[0.7rem] font-bold text-cream-50">Sold out</span>}
        </div>
      </div>
      <DishImage
        name={item.name}
        imageUrl={item.image_url}
        category={section.name}
        className="size-24 shrink-0 rounded-xl sm:size-28 lg:order-1 lg:aspect-[16/10] lg:size-auto lg:w-full lg:rounded-b-none lg:rounded-t-2xl"
      />
    </button>
  );
}
