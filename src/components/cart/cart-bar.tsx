"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ShoppingBag, ChevronRight } from "lucide-react";
import { useCart, useCartCount, useCartSubtotal } from "./cart-store";
import { formatMoney } from "@/lib/money";

const subscribe = () => () => undefined;

/** Sticky "View cart" bar — sits above the mobile tab bar. */
export function CartBar() {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const count = useCartCount();
  const subtotal = useCartSubtotal();
  const restaurant = useCart((s) => s.restaurant);
  if (!hydrated || count === 0 || !restaurant) return null;
  return (
    <div className="fixed inset-x-0 bottom-[calc(3.6rem+env(safe-area-inset-bottom))] z-30 px-3 md:bottom-6">
      <Link
        href="/cart"
        className="mx-auto flex h-14 max-w-lg animate-fade-up items-center gap-3 rounded-full bg-night-900 pl-2 pr-5 text-cream-50 shadow-[var(--shadow-lift)] transition hover:bg-night-800"
      >
        <span className="grid size-10 place-items-center rounded-full bg-ember-500 font-bold tabular-nums">{count}</span>
        <span className="flex-1 leading-tight">
          <span className="block text-sm font-bold">View cart</span>
          <span className="block truncate text-xs text-cream-200/70">{restaurant.name}</span>
        </span>
        <span className="font-bold tabular-nums">{formatMoney(subtotal, restaurant.currency)}</span>
        <ChevronRight className="size-4 text-cream-200/60" />
        <ShoppingBag className="sr-only" />
      </Link>
    </div>
  );
}
