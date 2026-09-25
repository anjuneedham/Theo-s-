"use client";

import { useState } from "react";
import { CheckCircle2, MapPin } from "lucide-react";
import { Select } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-store";

export function AreaChecker({ areas }: { areas: { area: string; zone: string; fee: string; time: string }[] }) {
  const [value, setValue] = useState("");
  const setArea = useCart((s) => s.setArea);
  const setFulfillment = useCart((s) => s.setFulfillment);
  const match = areas.find((a) => a.area === value);
  return (
    <div className="rounded-3xl bg-night-900 p-6 text-cream-50">
      <h2 className="flex items-center gap-2 text-2xl"><MapPin className="size-5 text-gold-400" /> Do we deliver to you?</h2>
      <Select aria-label="Choose your area" value={value} onChange={(e) => setValue(e.target.value)} className="mt-4 text-night-900">
        <option value="">Choose your area…</option>
        {[...areas].sort((a, b) => a.area.localeCompare(b.area)).map((a) => (
          <option key={a.area} value={a.area}>{a.area}</option>
        ))}
      </Select>
      {match && (
        <div className="mt-4 animate-fade-up rounded-2xl bg-cream-50/10 p-4">
          <p className="flex items-center gap-2 font-bold text-gold-300"><CheckCircle2 className="size-5" /> Yes! {match.area} is in {match.zone}.</p>
          <p className="mt-1 text-sm text-cream-200/80">Delivery {match.fee} · about {match.time}</p>
          <ButtonLink href="/order?mode=delivery" className="mt-4" onClick={() => { setArea(match.area); setFulfillment("delivery"); }}>Order for delivery</ButtonLink>
        </div>
      )}
      <p className="mt-4 text-xs text-cream-200/60">Not listed? Choose pickup, or contact us — we add new areas regularly.</p>
    </div>
  );
}
