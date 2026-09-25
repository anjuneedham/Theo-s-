import Link from "next/link";
import { ArrowRight, Bike, ShoppingBag, Clock, MapPin, Phone, BadgePercent, HeartHandshake, Receipt, Sparkles, CalendarDays, Music2, Store, MessageCircle } from "lucide-react";
import { Instagram, Facebook } from "@/components/ui/social-icons";
import { ButtonLink } from "@/components/ui/button";
import { DishImage } from "@/components/ui/dish-image";
import { DishArt } from "@/components/ui/dish-art";
import { SectionHeading, Stars } from "@/components/ui/primitives";
import { formatMoney } from "@/lib/money";
import { DAY_NAMES, formatHoursRow, isOpenAt } from "@/lib/hours";
import { getActivePromotions, getAnchorRestaurant, getHours, getMenu, getPublishedReviews, getUpcomingEvents, getZones, listMarketplace } from "@/lib/services/catalog";

export default async function HomePage() {
  const restaurant = await getAnchorRestaurant();
  const [menu, hours, zones, events, promos, reviews, network] = await Promise.all([
    getMenu(restaurant),
    getHours(restaurant.id),
    getZones(restaurant.id),
    getUpcomingEvents(restaurant.id, 3),
    getActivePromotions(restaurant.id),
    getPublishedReviews(restaurant.id, 3),
    listMarketplace(),
  ]);
  const open = isOpenAt(hours, restaurant.timezone);
  const featured = menu.flatMap((s) => s.items.filter((i) => i.is_featured && i.is_available).map((i) => ({ item: i, section: s.name })));
  const specials = menu.find((s) => s.slug === "specials")?.items ?? [];
  const categories = menu.filter((s) => s.items.length > 0);
  const today = new Date().toLocaleString("en-US", { timeZone: restaurant.timezone, weekday: "long" });
  const todayHours = hours.find((h) => DAY_NAMES[h.day_of_week] === today);
  const minFee = zones.length ? Math.min(...zones.map((z) => z.fee_cents)) : null;
  const heroDishes = featured.slice(0, 3);
  const partners = network.filter((l) => !l.restaurant.is_anchor);

  return (
    <>
      {/* HERO */}
      <section className="grain relative overflow-hidden bg-night-900 text-cream-50">
        <div className="pointer-events-none absolute -left-40 top-10 size-[36rem] rounded-full bg-ember-500/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-20 bottom-0 size-[28rem] rounded-full bg-gold-500/15 blur-3xl" aria-hidden />
        <div className="container-page relative grid items-center gap-12 pb-16 pt-28 sm:pb-24 lg:grid-cols-[1.1fr_1fr] lg:pb-28 lg:pt-36">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-cream-50/15 bg-cream-50/5 px-3.5 py-1.5 text-xs font-semibold">
              <span className={open ? "size-2 rounded-full bg-leaf-500 shadow-[0_0_0_4px_rgb(58_122_90/0.25)]" : "size-2 rounded-full bg-cream-200/50"} />
              {open ? "Open now" : "Closed now"} · {today} {formatHoursRow(todayHours)}
            </div>
            <h1 className="mt-6 text-5xl leading-[0.98] sm:text-6xl lg:text-7xl">
              Island soul food.
              <br />
              <span className="italic text-gold-400">Late-night</span> lounge.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream-200/80">
              Pimento-smoked jerk, Sunday oxtail and escovitch fish from our kitchen — rum punch and good vibes in the lounge. Order direct for pickup or delivery across {restaurant.city ?? "town"}.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/order" size="lg">
                Order online <ArrowRight className="size-4" />
              </ButtonLink>
              <ButtonLink href="/menu" size="lg" variant="outline-light">
                View the menu
              </ButtonLink>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-cream-50/10 pt-6 text-sm">
              <div>
                <dt className="text-cream-200/60">Pickup</dt>
                <dd className="mt-1 font-semibold">~{restaurant.prep_time_minutes} min</dd>
              </div>
              <div>
                <dt className="text-cream-200/60">Delivery from</dt>
                <dd className="mt-1 font-semibold">{minFee !== null ? formatMoney(minFee, restaurant.currency) : "—"}</dd>
              </div>
              <div>
                <dt className="text-cream-200/60">Service fee</dt>
                <dd className="mt-1 font-semibold text-gold-400">None direct</dd>
              </div>
            </dl>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-md lg:max-w-none" aria-hidden>
            <div className="absolute inset-[8%] rounded-full border border-cream-50/10" />
            <div className="absolute inset-[20%] rounded-full border border-dashed border-gold-400/20" />
            {heroDishes[0] && (
              <div className="absolute left-[14%] top-[10%] w-[62%] rotate-[-6deg] overflow-hidden rounded-[2rem] shadow-[0_40px_80px_-30px_rgb(0_0_0/0.8)] ring-1 ring-cream-50/10">
                <DishArt name={heroDishes[0].item.name} category={heroDishes[0].section} className="aspect-[4/3]" />
              </div>
            )}
            {heroDishes[1] && (
              <div className="absolute bottom-[12%] right-[2%] w-[48%] rotate-[7deg] overflow-hidden rounded-[1.75rem] shadow-[0_40px_80px_-30px_rgb(0_0_0/0.8)] ring-1 ring-cream-50/10">
                <DishArt name={heroDishes[1].item.name} category={heroDishes[1].section} className="aspect-[4/3]" />
              </div>
            )}
            {heroDishes[2] && (
              <div className="absolute bottom-[4%] left-[4%] w-[40%] rotate-[-2deg] overflow-hidden rounded-[1.5rem] shadow-[0_40px_80px_-30px_rgb(0_0_0/0.8)] ring-1 ring-cream-50/10">
                <DishArt name={heroDishes[2].item.name} category={heroDishes[2].section} className="aspect-[4/3]" />
              </div>
            )}
            <div className="absolute right-[6%] top-[14%] rounded-2xl bg-cream-50 px-4 py-3 text-night-900 shadow-xl">
              <p className="text-[0.65rem] font-bold uppercase tracking-widest text-ember-600">Tonight</p>
              <p className="font-display text-lg leading-tight">{events[0]?.title ?? "Lounge open late"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="container-page relative z-10 -mt-8">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { href: "/order?mode=delivery", icon: Bike, title: "Delivery", body: minFee !== null ? `To your door from ${formatMoney(minFee, restaurant.currency)}` : "Check your area" },
            { href: "/order?mode=pickup", icon: ShoppingBag, title: "Pickup", body: `Ready in about ${restaurant.prep_time_minutes} minutes` },
            { href: "/lounge", icon: Music2, title: "The Lounge", body: "Cocktails, music & events" },
          ].map((a) => (
            <Link key={a.title} href={a.href} className="card group flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-ember-50 text-ember-600 transition group-hover:bg-ember-500 group-hover:text-white">
                <a.icon className="size-6" />
              </span>
              <span className="flex-1">
                <span className="block font-bold">{a.title}</span>
                <span className="block text-sm text-night-600">{a.body}</span>
              </span>
              <ArrowRight className="size-4 text-night-600 transition group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED DISHES */}
      <section className="container-page py-20 sm:py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading eyebrow="From the kitchen" title="The dishes people come back for">
            Marinated overnight, cooked low and slow, finished over pimento wood.
          </SectionHeading>
          <ButtonLink href="/menu" variant="secondary">
            Full menu <ArrowRight className="size-4" />
          </ButtonLink>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.slice(0, 8).map(({ item, section }) => (
            <Link key={item.id} href={`/order#cat-${menu.find((s) => s.items.some((i) => i.id === item.id))?.slug}`} className="group">
              <DishImage name={item.name} imageUrl={item.image_url} category={section} className="aspect-[4/3] rounded-3xl transition duration-500 group-hover:shadow-[var(--shadow-lift)]" />
              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-clay-500">{section}</p>
                  <h3 className="mt-1 font-sans text-lg font-bold">{item.name}</h3>
                </div>
                <span className="mt-5 font-semibold tabular-nums">{formatMoney(item.price_cents, restaurant.currency)}</span>
              </div>
              {item.description && <p className="mt-1 line-clamp-2 text-sm text-night-600">{item.description}</p>}
            </Link>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="border-y border-cream-200 bg-cream-50 py-14">
        <div className="container-page">
          <h2 className="text-2xl sm:text-3xl">Browse by craving</h2>
          <div className="no-scrollbar -mx-4 mt-6 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-5 sm:px-0 lg:grid-cols-9">
            {categories.map((c) => (
              <Link key={c.id} href={`/menu#cat-${c.slug}`} className="group w-28 shrink-0 text-center sm:w-auto">
                <div className="mx-auto aspect-square w-full overflow-hidden rounded-full ring-4 ring-white transition group-hover:ring-gold-300">
                  <DishArt name={c.items[0]?.name ?? c.name} category={c.name} />
                </div>
                <p className="mt-2.5 text-sm font-semibold">{c.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SPECIALS */}
      {(specials.length > 0 || promos.length > 0) && (
        <section className="container-page py-20 sm:py-24">
          <SectionHeading eyebrow="This week" title="Specials & offers" />
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {promos.slice(0, 2).map((p) => (
              <div key={p.id} className="relative overflow-hidden rounded-3xl bg-ember-500 p-7 text-white">
                <BadgePercent className="size-8 text-gold-300" />
                <h3 className="mt-4 text-2xl leading-tight">{p.title}</h3>
                {p.description && <p className="mt-2 text-sm text-white/85">{p.description}</p>}
                {p.code && (
                  <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold tracking-wider">
                    Use code <span className="rounded bg-white px-2 py-0.5 text-ember-700">{p.code}</span>
                  </p>
                )}
                <div className="pointer-events-none absolute -bottom-16 -right-16 size-48 rounded-full bg-white/10" aria-hidden />
              </div>
            ))}
            {specials.slice(0, 3 - Math.min(2, promos.length)).map((item) => (
              <Link key={item.id} href="/specials" className="card group flex flex-col overflow-hidden">
                <DishImage name={item.name} imageUrl={item.image_url} category="Specials" className="aspect-[16/9]" />
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-sans text-lg font-bold">{item.name}</h3>
                  <p className="mt-1 flex-1 text-sm text-night-600">{item.description}</p>
                  <p className="mt-4 font-semibold">{formatMoney(item.price_cents, restaurant.currency)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ABOUT */}
      <section className="bg-cream-200/60 py-20 sm:py-24">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <div className="grid grid-cols-2 gap-4" aria-hidden>
            <div className="overflow-hidden rounded-3xl"><DishArt name="Braised Oxtail" className="aspect-[3/4]" /></div>
            <div className="mt-12 overflow-hidden rounded-3xl"><DishArt name="Theo's Rum Punch" category="Cocktails" className="aspect-[3/4]" /></div>
          </div>
          <div>
            <SectionHeading eyebrow="About Theo's" title="A table for family, friends and whoever walks in hungry">
              {restaurant.description}
            </SectionHeading>
            <ul className="mt-8 space-y-4">
              {["Jerk marinated for 24 hours and smoked over pimento wood", "Stews and soups made fresh every morning", "Local produce, Blue Mountain coffee and Jamaican rum"].map((t) => (
                <li key={t} className="flex gap-3">
                  <Sparkles className="mt-0.5 size-5 shrink-0 text-gold-500" />
                  <span className="text-night-700">{t}</span>
                </li>
              ))}
            </ul>
            <ButtonLink href="/about" variant="dark" className="mt-8">
              Our story <ArrowRight className="size-4" />
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* LOUNGE & EVENTS */}
      <section className="grain relative overflow-hidden bg-night-950 py-20 text-cream-50 sm:py-24">
        <div className="pointer-events-none absolute right-0 top-0 size-96 rounded-full bg-ember-600/20 blur-3xl" aria-hidden />
        <div className="container-page relative grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <SectionHeading eyebrow="The Lounge" title="When the kitchen slows down, the lounge comes alive" light>
              Handcrafted rum cocktails, a selector on the decks and the best late-night bites in town. Open until 2am Friday and Saturday.
            </SectionHeading>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/lounge" variant="gold">Explore the lounge</ButtonLink>
              <ButtonLink href="/events" variant="outline-light">All events</ButtonLink>
            </div>
          </div>
          <div className="space-y-3">
            {events.length === 0 && <p className="text-cream-200/70">New events are announced every week — check back soon.</p>}
            {events.map((e) => {
              const d = new Date(e.starts_at);
              return (
                <Link key={e.id} href="/events" className="flex items-center gap-5 rounded-3xl border border-cream-50/10 bg-cream-50/[0.04] p-5 transition hover:bg-cream-50/[0.08]">
                  <div className="grid w-16 shrink-0 place-items-center rounded-2xl bg-gold-400 py-2 text-night-950">
                    <span className="text-xs font-bold uppercase">{d.toLocaleString("en-US", { timeZone: restaurant.timezone, month: "short" })}</span>
                    <span className="font-display text-2xl leading-none">{d.toLocaleString("en-US", { timeZone: restaurant.timezone, day: "numeric" })}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-sans text-lg font-bold">{e.title}</h3>
                    <p className="mt-0.5 line-clamp-1 text-sm text-cream-200/70">{e.description}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-gold-400">
                      <CalendarDays className="size-3.5" />
                      {d.toLocaleString("en-US", { timeZone: restaurant.timezone, weekday: "long", hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* DELIVERY + WHY DIRECT */}
      <section className="container-page grid gap-6 py-20 sm:py-24 lg:grid-cols-2">
        <div className="card min-w-0 p-8 sm:p-10">
          <p className="eyebrow">Delivery</p>
          <h2 className="mt-3 text-3xl">Hot to your door</h2>
          <p className="mt-3 text-night-600">Pick your area at checkout to see the exact fee and time. No surprises.</p>
          <ul className="mt-6 divide-y divide-cream-200">
            {zones.map((z) => (
              <li key={z.id} className="flex items-center justify-between gap-4 py-3.5">
                <div className="min-w-0">
                  <p className="font-bold">{z.name}</p>
                  <p className="truncate text-sm text-night-600">{z.areas.slice(0, 4).join(", ")}{z.areas.length > 4 ? "…" : ""}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold tabular-nums">{formatMoney(z.fee_cents, restaurant.currency)}</p>
                  <p className="text-xs text-night-600">{z.min_minutes}–{z.max_minutes} min</p>
                </div>
              </li>
            ))}
          </ul>
          <ButtonLink href="/delivery" variant="secondary" className="mt-6">
            Check your area <MapPin className="size-4" />
          </ButtonLink>
        </div>
        <div className="rounded-[var(--radius-card)] bg-night-900 p-8 text-cream-50 sm:p-10">
          <p className="eyebrow text-gold-400">Why order direct</p>
          <h2 className="mt-3 text-3xl">Better for you. Better for Theo&apos;s.</h2>
          <ul className="mt-8 space-y-6">
            {[
              { icon: Receipt, title: "No service fee", body: "Ordering straight from Theo's has no platform service fee — just your food and delivery." },
              { icon: BadgePercent, title: "Direct-only offers", body: "Codes like WELCOME10 are only available when you order here." },
              { icon: Clock, title: "Live order tracking", body: "Follow your order from the kitchen to your door, and reorder favourites in one tap." },
              { icon: HeartHandshake, title: "Support local", body: "More of every dollar stays with the kitchen team and our drivers." },
            ].map((b) => (
              <li key={b.title} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cream-50/10 text-gold-400">
                  <b.icon className="size-5" />
                </span>
                <div>
                  <p className="font-bold">{b.title}</p>
                  <p className="mt-0.5 text-sm text-cream-200/70">{b.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* TESTIMONIALS — real reviews only */}
      <section className="bg-cream-50 py-20 sm:py-24">
        <div className="container-page">
          <SectionHeading eyebrow="Reviews" title="What our guests say" align="center" />
          {reviews.length > 0 ? (
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {reviews.map((r) => (
                <figure key={r.id} className="card p-7">
                  <Stars rating={r.rating} />
                  {r.comment && <blockquote className="mt-4 font-display text-lg leading-snug">“{r.comment}”</blockquote>}
                  <figcaption className="mt-5 text-sm font-semibold text-night-600">— {r.author_name}, verified order</figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <div className="mx-auto mt-8 max-w-xl text-center text-night-600">
              <p>Reviews on this page come only from verified orders. Order online, and after your meal you&apos;ll be able to leave the first one.</p>
              <ButtonLink href="/order" className="mt-6">Place an order</ButtonLink>
            </div>
          )}
        </div>
      </section>

      {/* NETWORK */}
      <section className="container-page py-20 sm:py-24">
        <div className="grain relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-leaf-700 to-night-900 p-8 text-cream-50 sm:p-14">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <p className="eyebrow text-gold-400">Theo&apos;s Delivery Network</p>
              <h2 className="mt-3 text-3xl sm:text-4xl">More kitchens. More neighbourhoods. One trusted delivery.</h2>
              <p className="mt-4 max-w-xl text-cream-200/80">
                We&apos;re opening our ordering and delivery platform to partner restaurants across Jamaica. Browse the network today, or bring your restaurant on board.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/restaurants" variant="gold">
                  <Store className="size-4" /> Browse restaurants
                </ButtonLink>
                <ButtonLink href="/partners" variant="outline-light">Partner with us</ButtonLink>
              </div>
            </div>
            <ul className="space-y-3">
              {partners.slice(0, 3).map((l) => (
                <li key={l.restaurant.id}>
                  <Link href={`/restaurants/${l.restaurant.slug}`} className="flex items-center gap-4 rounded-2xl bg-cream-50/[0.07] p-3 transition hover:bg-cream-50/[0.12]">
                    <div className="size-14 shrink-0 overflow-hidden rounded-xl">
                      <DishArt name={l.categories[0]?.name ?? l.restaurant.name} category={l.categories[0]?.name} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold">{l.restaurant.name}</p>
                      <p className="truncate text-sm text-cream-200/70">{l.restaurant.city} · {l.categories.map((c) => c.name).join(", ")}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* VISIT */}
      <section className="border-t border-cream-200 bg-cream-50 py-20">
        <div className="container-page grid gap-10 md:grid-cols-3">
          <div>
            <h2 className="text-3xl">Visit us</h2>
            <p className="mt-3 flex gap-2 text-night-700">
              <MapPin className="mt-1 size-4 shrink-0 text-ember-500" />
              {[restaurant.address_line, restaurant.area, restaurant.city, "Jamaica"].filter(Boolean).join(", ")}
            </p>
            {restaurant.phone && (
              <p className="mt-2 flex gap-2 text-night-700">
                <Phone className="mt-1 size-4 shrink-0 text-ember-500" />
                <a href={`tel:${restaurant.phone.replace(/[^\d+]/g, "")}`} className="hover:text-ember-600">{restaurant.phone}</a>
              </p>
            )}
            <div className="mt-5 flex gap-2">
              {restaurant.social_instagram && <a href={restaurant.social_instagram} aria-label="Instagram" target="_blank" rel="noopener" className="grid size-10 place-items-center rounded-full border border-cream-300 hover:bg-cream-200"><Instagram className="size-4" /></a>}
              {restaurant.social_facebook && <a href={restaurant.social_facebook} aria-label="Facebook" target="_blank" rel="noopener" className="grid size-10 place-items-center rounded-full border border-cream-300 hover:bg-cream-200"><Facebook className="size-4" /></a>}
              {restaurant.whatsapp && <a href={`https://wa.me/${restaurant.whatsapp.replace(/\D/g, "")}`} aria-label="WhatsApp" target="_blank" rel="noopener" className="grid size-10 place-items-center rounded-full border border-cream-300 hover:bg-cream-200"><MessageCircle className="size-4" /></a>}
            </div>
          </div>
          <div>
            <h3 className="font-sans text-sm font-bold uppercase tracking-widest text-clay-500">Opening hours</h3>
            <dl className="mt-4 space-y-2 text-sm">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <div key={d} className="flex justify-between border-b border-dashed border-cream-300 pb-2">
                  <dt className={DAY_NAMES[d] === today ? "font-bold" : ""}>{DAY_NAMES[d]}</dt>
                  <dd className="tabular-nums">{formatHoursRow(hours.find((h) => h.day_of_week === d))}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="flex flex-col justify-between gap-6 rounded-3xl bg-night-900 p-7 text-cream-50">
            <div>
              <h3 className="text-2xl">Hungry already?</h3>
              <p className="mt-2 text-sm text-cream-200/70">Order in under a minute. Pay cash or card when your food arrives.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/order">Order online</ButtonLink>
              <ButtonLink href="/contact" variant="outline-light">Contact</ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
