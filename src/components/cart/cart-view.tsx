"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Bike } from "lucide-react";
import { useCart, lineUnitCents, useCartSubtotal } from "./cart-store";
import { DishImage } from "@/components/ui/dish-image";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";
import { formatMoney } from "@/lib/money";

const subscribe = () => () => undefined;

export function CartView() {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const { lines, restaurant, setQuantity, remove, fulfillment, clear } = useCart();
  const subtotal = useCartSubtotal();

  if (!hydrated) return <div className="container-page min-h-[50vh] py-16" aria-busy />;

  if (!restaurant || lines.length === 0) {
    return (
      <div className="container-page max-w-2xl py-16">
        <EmptyState icon={<ShoppingBag className="size-6" />} title="Your cart is empty" action={<ButtonLink href="/order">Browse the menu</ButtonLink>}>
          Add a few favourites from Theo&apos;s — or explore other restaurants on the network.
        </EmptyState>
      </div>
    );
  }

  const menuHref = restaurant.is_anchor ? "/order" : `/restaurants/${restaurant.slug}`;
  const hasAlcohol = lines.some((l) => l.is_alcohol);

  return (
    <div className="container-page grid gap-8 py-10 pb-32 lg:grid-cols-[1fr_380px] lg:py-14">
      <div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl">Your order</h1>
            <p className="mt-1 text-night-600">
              From <Link href={menuHref} className="font-semibold text-night-900 underline decoration-cream-300 underline-offset-4">{restaurant.name}</Link>
            </p>
          </div>
          <button onClick={clear} className="text-sm font-semibold text-night-600 hover:text-ember-600">
            Clear cart
          </button>
        </div>
        <ul className="mt-6 divide-y divide-cream-200 rounded-3xl border border-cream-200 bg-white">
          {lines.map((l) => (
            <li key={l.key} className="flex gap-4 p-4 sm:p-5">
              <DishImage name={l.name} imageUrl={l.image_url} category={l.category} className="size-20 shrink-0 rounded-xl" sizes="80px" />
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-3">
                  <h2 className="font-sans text-base font-bold">{l.name}</h2>
                  <span className="shrink-0 font-semibold tabular-nums">{formatMoney(lineUnitCents(l) * l.quantity, restaurant.currency)}</span>
                </div>
                {l.modifiers.length > 0 && <p className="mt-0.5 text-sm text-night-600">{l.modifiers.map((m) => m.name).join(" · ")}</p>}
                {l.special_instructions && <p className="mt-0.5 text-sm italic text-night-600">“{l.special_instructions}”</p>}
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center rounded-full border border-cream-300">
                    <button className="grid size-9 place-items-center" onClick={() => setQuantity(l.key, l.quantity - 1)} aria-label={`Decrease ${l.name}`}>
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-7 text-center text-sm font-bold tabular-nums">{l.quantity}</span>
                    <button className="grid size-9 place-items-center" onClick={() => setQuantity(l.key, l.quantity + 1)} aria-label={`Increase ${l.name}`}>
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <button onClick={() => remove(l.key)} className="inline-flex items-center gap-1 text-sm text-night-600 hover:text-ember-600" aria-label={`Remove ${l.name}`}>
                    <Trash2 className="size-4" /> Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <Link href={menuHref} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ember-600">
          <Plus className="size-4" /> Add more items
        </Link>
      </div>
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="card p-6">
          <h2 className="text-xl">Summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-night-600">Subtotal</dt>
              <dd className="font-semibold tabular-nums">{formatMoney(subtotal, restaurant.currency)}</dd>
            </div>
            <div className="flex justify-between text-night-600">
              <dt className="flex items-center gap-1.5"><Bike className="size-4" /> {fulfillment === "delivery" ? "Delivery fee" : "Pickup"}</dt>
              <dd>{fulfillment === "delivery" ? "At checkout" : "Free"}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-night-600">Final prices, delivery fee and any promo codes are confirmed at checkout.</p>
          {hasAlcohol && <p className="mt-3 rounded-xl bg-cream-200 px-3 py-2 text-xs font-semibold text-night-700">Your order contains alcohol — ID showing 18+ is required.</p>}
          <ButtonLink href="/checkout" size="lg" className="mt-5 w-full">
            Checkout <ArrowRight className="size-4" />
          </ButtonLink>
        </div>
      </aside>
    </div>
  );
}
