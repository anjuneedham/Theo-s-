"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, X, Flame, Clock } from "lucide-react";
import type { MenuItemWithOptions, MenuSection } from "@/lib/services/catalog";
import { Modal } from "@/components/ui/modal";
import { DishImage } from "@/components/ui/dish-image";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { formatTime } from "@/lib/hours";
import { cn } from "@/lib/cn";
import { useCart, type CartRestaurant } from "@/components/cart/cart-store";
import { toast } from "@/components/ui/toast";
import { track } from "@/lib/analytics-client";

export function ItemSheet({
  restaurant,
  item,
  section,
  orderable,
  onClose,
}: {
  restaurant: CartRestaurant;
  item: MenuItemWithOptions;
  section: MenuSection;
  orderable: boolean;
  onClose: () => void;
}) {
  const add = useCart((s) => s.add);
  const cartRestaurant = useCart((s) => s.restaurant);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [confirmSwitch, setConfirmSwitch] = useState(false);
  const [selected, setSelected] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(
      item.groups.map((g) => [g.id, g.modifiers.filter((m) => m.is_default && m.is_available).slice(0, Math.max(1, g.max_select)).map((m) => m.id)]),
    ),
  );

  const chosen = useMemo(() => item.groups.flatMap((g) => g.modifiers.filter((m) => selected[g.id]?.includes(m.id)).map((m) => ({ ...m, group: g.name }))), [item.groups, selected]);
  const unit = item.price_cents + chosen.reduce((s, m) => s + m.price_delta_cents, 0);
  const missing = item.groups.filter((g) => (selected[g.id]?.length ?? 0) < g.min_select);

  function toggle(groupId: string, modId: string, single: boolean, max: number) {
    setSelected((prev) => {
      const cur = prev[groupId] ?? [];
      if (single) return { ...prev, [groupId]: [modId] };
      if (cur.includes(modId)) return { ...prev, [groupId]: cur.filter((x) => x !== modId) };
      if (max > 0 && cur.length >= max) return prev;
      return { ...prev, [groupId]: [...cur, modId] };
    });
  }

  function commit() {
    if (missing.length) {
      toast.error(`Please choose ${missing[0].name.toLowerCase()}`);
      document.getElementById(`group-${missing[0].id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (cartRestaurant && cartRestaurant.id !== restaurant.id && !confirmSwitch) {
      setConfirmSwitch(true);
      return;
    }
    add(restaurant, {
      menu_item_id: item.id,
      name: item.name,
      image_url: item.image_url,
      category: section.name,
      base_price_cents: item.price_cents,
      modifiers: chosen.map((m) => ({ id: m.id, name: m.name, group: m.group, price_delta_cents: m.price_delta_cents })),
      quantity,
      special_instructions: notes.trim() || null,
      is_alcohol: item.dietary_tags.includes("alcohol"),
    });
    track("add_to_cart", { restaurant_id: restaurant.id, properties: { item_id: item.id, quantity, value_cents: unit * quantity } });
    toast.success(`Added ${quantity} × ${item.name}`);
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      footer={
        orderable ? (
          confirmSwitch ? (
            <div className="space-y-3">
              <p className="text-sm text-night-700">
                Your cart has items from <strong>{cartRestaurant?.name}</strong>. Start a new cart with {restaurant.name}?
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setConfirmSwitch(false)}>
                  Keep cart
                </Button>
                <Button className="flex-1" onClick={commit}>
                  Start new cart
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-full border border-cream-300 bg-white">
                <button className="grid size-11 place-items-center disabled:opacity-40" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1} aria-label="Decrease quantity">
                  <Minus className="size-4" />
                </button>
                <span className="w-8 text-center font-bold tabular-nums" aria-live="polite">{quantity}</span>
                <button className="grid size-11 place-items-center disabled:opacity-40" onClick={() => setQuantity((q) => Math.min(50, q + 1))} disabled={quantity >= 50} aria-label="Increase quantity">
                  <Plus className="size-4" />
                </button>
              </div>
              <Button size="lg" className="flex-1 justify-between px-6" onClick={commit}>
                <span>Add to order</span>
                <span className="tabular-nums">{formatMoney(unit * quantity, restaurant.currency)}</span>
              </Button>
            </div>
          )
        ) : (
          <p className="flex items-center justify-center gap-2 py-2 text-sm font-semibold text-night-700">
            <Clock className="size-4" />
            {!item.is_available
              ? "Sold out right now"
              : section.available_from && section.available_until
                ? `Available ${formatTime(section.available_from)}–${formatTime(section.available_until)}`
                : "Not available right now"}
          </p>
        )
      }
    >
      <div className="relative">
        <DishImage name={item.name} imageUrl={item.image_url} category={section.name} className="aspect-[16/10] w-full" sizes="(max-width: 640px) 100vw, 512px" priority />
        <button onClick={onClose} className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-cream-50/95 shadow" aria-label="Close">
          <X className="size-5" />
        </button>
      </div>
      <div className="px-5 pb-6 pt-5">
        <h2 className="text-3xl leading-tight">{item.name}</h2>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-lg font-semibold tabular-nums">{formatMoney(item.price_cents, restaurant.currency)}</span>
          {item.spice_level > 0 && (
            <span className="inline-flex text-ember-500" aria-label={`Spice level ${item.spice_level} of 3`}>
              {Array.from({ length: item.spice_level }).map((_, i) => (
                <Flame key={i} className="size-4 fill-current" />
              ))}
            </span>
          )}
        </div>
        {item.description && <p className="mt-3 leading-relaxed text-night-600">{item.description}</p>}
        {item.dietary_tags.includes("alcohol") && (
          <p className="mt-3 rounded-xl bg-cream-200 px-3 py-2 text-xs font-semibold text-night-700">Contains alcohol. Valid ID showing you are 18+ is required on pickup and delivery.</p>
        )}

        {item.groups.map((g) => {
          const single = g.max_select === 1;
          const count = selected[g.id]?.length ?? 0;
          return (
            <fieldset key={g.id} id={`group-${g.id}`} className="mt-7">
              <legend className="flex w-full items-center justify-between">
                <span className="text-base font-bold">{g.name}</span>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", g.min_select > 0 ? (count >= g.min_select ? "bg-leaf-50 text-leaf-700" : "bg-ember-50 text-ember-700") : "bg-cream-200 text-night-600")}>
                  {g.min_select > 0 ? (count >= g.min_select ? "Done" : "Required") : g.max_select > 1 ? `Up to ${g.max_select}` : "Optional"}
                </span>
              </legend>
              <div className="mt-3 divide-y divide-cream-200 overflow-hidden rounded-2xl border border-cream-200 bg-white">
                {g.modifiers.map((m) => {
                  const checked = selected[g.id]?.includes(m.id) ?? false;
                  const atMax = !single && g.max_select > 0 && count >= g.max_select && !checked;
                  return (
                    <label key={m.id} className={cn("flex min-h-13 cursor-pointer items-center gap-3 px-4 py-3", (!m.is_available || atMax) && "cursor-not-allowed opacity-50")}>
                      <input
                        type={single ? "radio" : "checkbox"}
                        name={g.id}
                        checked={checked}
                        disabled={!m.is_available || atMax}
                        onChange={() => toggle(g.id, m.id, single, g.max_select)}
                        className="size-5 accent-ember-500"
                      />
                      <span className="flex-1 text-[0.95rem]">{m.name}{!m.is_available && " (unavailable)"}</span>
                      {m.price_delta_cents !== 0 && <span className="text-sm tabular-nums text-night-600">+{formatMoney(m.price_delta_cents, restaurant.currency)}</span>}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          );
        })}

        {orderable && (
          <div className="mt-7">
            <label htmlFor="item-notes" className="text-base font-bold">
              Special instructions
            </label>
            <textarea
              id="item-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 300))}
              placeholder="Allergies, no onions, sauce on the side…"
              className="field-input mt-2 min-h-20"
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
