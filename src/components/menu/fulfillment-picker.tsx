"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Bike, ShoppingBag, MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";
import { useCart, type CartRestaurant } from "@/components/cart/cart-store";
import { Select } from "@/components/ui/primitives";

interface ZoneSummary {
  id: string;
  name: string;
  fee_cents: number;
  min_minutes: number;
  max_minutes: number;
  areas: string[];
  min_order_cents: number;
}

const subscribe = () => () => undefined;

/** Pickup / delivery toggle with an area picker that shows the fee and ETA instantly. */
export function FulfillmentPicker({
  restaurant,
  areas,
  zones,
  prepMinutes,
  acceptsDelivery,
  acceptsPickup,
  initialMode,
  address,
}: {
  restaurant: CartRestaurant;
  areas: string[];
  zones: ZoneSummary[];
  prepMinutes: number;
  acceptsDelivery: boolean;
  acceptsPickup: boolean;
  initialMode?: "pickup" | "delivery";
  address: string;
}) {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const { fulfillment, setFulfillment, area, setArea } = useCart();
  useEffect(() => {
    if (initialMode) setFulfillment(initialMode);
  }, [initialMode, setFulfillment]);
  useEffect(() => {
    if (!acceptsDelivery && fulfillment === "delivery") setFulfillment("pickup");
    if (!acceptsPickup && fulfillment === "pickup") setFulfillment("delivery");
  }, [acceptsDelivery, acceptsPickup, fulfillment, setFulfillment]);

  const mode = hydrated ? fulfillment : initialMode ?? "delivery";
  const zone = area ? zones.find((z) => z.areas.some((a) => a.toLowerCase() === area.toLowerCase())) : undefined;

  return (
    <div className="mt-5 grid gap-4 lg:grid-cols-[auto_1fr] lg:items-center">
      <div className="inline-flex rounded-full bg-cream-200 p-1" role="radiogroup" aria-label="Pickup or delivery">
        {acceptsDelivery && (
          <button
            role="radio"
            aria-checked={mode === "delivery"}
            onClick={() => setFulfillment("delivery")}
            className={cn("flex h-11 items-center gap-2 rounded-full px-5 text-sm font-bold transition", mode === "delivery" ? "bg-night-900 text-cream-50 shadow" : "text-night-700")}
          >
            <Bike className="size-4" /> Delivery
          </button>
        )}
        {acceptsPickup && (
          <button
            role="radio"
            aria-checked={mode === "pickup"}
            onClick={() => setFulfillment("pickup")}
            className={cn("flex h-11 items-center gap-2 rounded-full px-5 text-sm font-bold transition", mode === "pickup" ? "bg-night-900 text-cream-50 shadow" : "text-night-700")}
          >
            <ShoppingBag className="size-4" /> Pickup
          </button>
        )}
      </div>
      {mode === "delivery" ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative sm:w-72">
            <MapPin className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-ember-500" />
            <Select aria-label="Your area" value={hydrated ? area ?? "" : ""} onChange={(e) => setArea(e.target.value || null)} className="h-12 py-0 pl-11">
              <option value="">Choose your area…</option>
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          </div>
          {zone ? (
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-night-700">
              <span>
                <strong>{formatMoney(zone.fee_cents, restaurant.currency)}</strong> delivery
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-4 text-night-600" /> {zone.min_minutes + prepMinutes}–{zone.max_minutes + prepMinutes} min
              </span>
              {zone.min_order_cents > 0 && <span className="text-night-600">Min. order {formatMoney(zone.min_order_cents, restaurant.currency)}</span>}
            </p>
          ) : (
            <p className="text-sm text-night-600">Don&apos;t see your area? Choose pickup, or <a href="/contact" className="font-semibold text-ember-600 underline">ask us</a> — we&apos;re expanding.</p>
          )}
        </div>
      ) : (
        <p className="flex items-center gap-2 text-sm text-night-700">
          <Clock className="size-4 text-night-600" /> Ready in about <strong>{prepMinutes} min</strong>
          {address && <span className="text-night-600">· {address}</span>}
        </p>
      )}
    </div>
  );
}
