"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { FulfillmentType } from "@/lib/types";

export interface CartModifier {
  id: string;
  name: string;
  group: string;
  price_delta_cents: number;
}

export interface CartLine {
  key: string;
  menu_item_id: string;
  name: string;
  image_url: string | null;
  category: string;
  base_price_cents: number;
  modifiers: CartModifier[];
  quantity: number;
  special_instructions: string | null;
  is_alcohol: boolean;
}

export interface CartRestaurant {
  id: string;
  slug: string;
  name: string;
  currency: string;
  is_anchor: boolean;
}

interface CartState {
  restaurant: CartRestaurant | null;
  lines: CartLine[];
  fulfillment: FulfillmentType;
  area: string | null;
  add: (restaurant: CartRestaurant, line: Omit<CartLine, "key">) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  setFulfillment: (f: FulfillmentType) => void;
  setArea: (area: string | null) => void;
}

export function lineUnitCents(line: Pick<CartLine, "base_price_cents" | "modifiers">) {
  return line.base_price_cents + line.modifiers.reduce((s, m) => s + m.price_delta_cents, 0);
}

function keyFor(line: Omit<CartLine, "key">) {
  return [line.menu_item_id, ...line.modifiers.map((m) => m.id).sort(), line.special_instructions ?? ""].join("|");
}

/**
 * Client cart, persisted to localStorage so it survives reloads and app
 * restarts. Prices here are for display only — the server re-prices every
 * order from the database.
 */
export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      restaurant: null,
      lines: [],
      fulfillment: "delivery",
      area: null,
      add(restaurant, line) {
        const state = get();
        const sameRestaurant = state.restaurant?.id === restaurant.id;
        const lines = sameRestaurant ? [...state.lines] : [];
        const key = keyFor(line);
        const existing = lines.find((l) => l.key === key);
        if (existing) existing.quantity = Math.min(50, existing.quantity + line.quantity);
        else lines.push({ ...line, key });
        set({ restaurant, lines });
      },
      setQuantity(key, quantity) {
        set({
          lines: get()
            .lines.map((l) => (l.key === key ? { ...l, quantity: Math.max(0, Math.min(50, quantity)) } : l))
            .filter((l) => l.quantity > 0),
        });
        if (get().lines.length === 0) set({ restaurant: null });
      },
      remove(key) {
        set({ lines: get().lines.filter((l) => l.key !== key) });
        if (get().lines.length === 0) set({ restaurant: null });
      },
      clear: () => set({ lines: [], restaurant: null }),
      setFulfillment: (fulfillment) => set({ fulfillment }),
      setArea: (area) => set({ area }),
    }),
    { name: "theos-cart-v1", storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);

export function useCartCount() {
  return useCart((s) => s.lines.reduce((n, l) => n + l.quantity, 0));
}
export function useCartSubtotal() {
  return useCart((s) => s.lines.reduce((n, l) => n + lineUnitCents(l) * l.quantity, 0));
}
