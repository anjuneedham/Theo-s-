"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MapPin, Phone, Navigation, Package, CheckCircle2, Store } from "lucide-react";
import type { Delivery, Driver, Order, Restaurant } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { statusLabel } from "@/lib/order-status";
import { api } from "@/lib/api-client";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

interface Board {
  driver: Driver;
  available: { delivery: Delivery; restaurant: { name: string; city: string | null; address_line: string | null } | null; order: { id: string; order_number: string; status: Order["status"]; area: string | null; estimated_ready_at: string | null } }[];
  mine: { delivery: Delivery; order: Order; restaurant: Restaurant | null }[];
  completedToday: { delivery: Delivery; order: Order; restaurant: Restaurant | null }[];
}

export function DriverApp({ board }: { board: Board }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 15000);
    return () => clearInterval(t);
  }, [router]);

  async function act(id: string, action: "accept" | "pickup" | "deliver", msg: string) {
    setBusy(id + action);
    try {
      await api(`/api/v1/driver/deliveries/${id}`, { method: "PATCH", body: { action } });
      toast.success(msg);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }
  async function setStatus(status: Driver["status"]) {
    try {
      await api("/api/v1/driver/status", { method: "PATCH", body: { status } });
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const earnings = board.completedToday.reduce((s, x) => s + x.delivery.driver_payout_cents + x.delivery.tip_cents, 0);
  const online = board.driver.status !== "offline";

  return (
    <div className="space-y-6">
      <section className="card flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-night-600">Hi {board.driver.full_name.split(" ")[0]}</p>
          <p className="text-2xl font-display">{online ? "You're online" : "You're offline"}</p>
          <p className="text-sm text-night-600">Today: {board.completedToday.length} deliveries · {formatMoney(earnings)}</p>
        </div>
        <button
          role="switch"
          aria-checked={online}
          onClick={() => setStatus(online ? "offline" : "available")}
          className={cn("relative h-9 w-16 rounded-full transition", online ? "bg-leaf-500" : "bg-cream-300")}
          aria-label="Online status"
        >
          <span className={cn("absolute top-1 size-7 rounded-full bg-white shadow transition", online ? "left-8" : "left-1")} />
        </button>
      </section>

      {board.mine.length > 0 && (
        <section>
          <h2 className="text-xl">Your deliveries</h2>
          <div className="mt-3 space-y-3">
            {board.mine.map(({ delivery: d, order: o, restaurant: r }) => {
              const addr = o.delivery_address;
              const mapQuery = addr?.latitude != null ? `${addr.latitude},${addr.longitude}` : [addr?.line1, addr?.area, addr?.city, "Jamaica"].filter(Boolean).join(", ");
              return (
                <article key={d.id} className="card p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-bold">{o.order_number}</p>
                    <span className="rounded-full bg-cream-200 px-2.5 py-1 text-xs font-bold">{statusLabel(o.status, "delivery")}</span>
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    <p className="flex gap-2"><Store className="size-4 shrink-0 text-ember-500" /><span><strong>Pick up:</strong> {r?.name} — {[r?.address_line, r?.city].filter(Boolean).join(", ")}</span></p>
                    <p className="flex gap-2"><MapPin className="size-4 shrink-0 text-ember-500" /><span><strong>Deliver to:</strong> {o.contact_name}, {[addr?.line1, addr?.line2, addr?.area].filter(Boolean).join(", ")}{addr?.instructions && <em className="block text-night-600">{addr.instructions}</em>}</span></p>
                    <p className="flex gap-2"><Package className="size-4 shrink-0 text-ember-500" /><span>{o.payment_method === "online" && o.payment_status === "paid" ? "Paid online — nothing to collect" : <>Collect <strong>{formatMoney(o.total_cents, o.currency)}</strong> ({o.payment_method === "cash" ? "cash" : "card"})</>}</span></p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a href={`tel:${o.contact_phone.replace(/[^\d+]/g, "")}`} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-cream-300 px-3 text-sm font-semibold"><Phone className="size-4" /> Call</a>
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery)}`} target="_blank" rel="noopener" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-cream-300 px-3 text-sm font-semibold"><Navigation className="size-4" /> Navigate</a>
                    {d.status === "assigned" && (
                      <Button size="sm" disabled={o.status !== "ready"} loading={busy === d.id + "pickup"} onClick={() => act(d.id, "pickup", "Picked up — customer notified")}>
                        {o.status === "ready" ? "Picked up" : "Waiting for kitchen…"}
                      </Button>
                    )}
                    {d.status === "picked_up" && (
                      <Button size="sm" loading={busy === d.id + "deliver"} onClick={() => confirm("Confirm the order was handed over and payment collected?") && act(d.id, "deliver", "Delivered!")}>
                        <CheckCircle2 className="size-4" /> Delivered
                      </Button>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-night-600">Your pay: {formatMoney(d.driver_payout_cents)}{d.tip_cents > 0 && ` + ${formatMoney(d.tip_cents)} tip`}</p>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl">Available jobs</h2>
        {!online ? <p className="mt-2 text-sm text-night-600">Go online to see available deliveries.</p> : board.available.length === 0 ? <p className="mt-2 text-sm text-night-600">No jobs right now — this page refreshes automatically.</p> : (
          <div className="mt-3 space-y-3">
            {board.available.map(({ delivery: d, restaurant: r, order: o }) => (
              <article key={d.id} className="card flex items-center gap-4 p-5">
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-bold">{r?.name} → {o.area}</p>
                  <p className="text-night-600">{o.order_number} · {statusLabel(o.status, "delivery")}{o.estimated_ready_at && ` · ready ~${new Date(o.estimated_ready_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Jamaica" })}`}</p>
                  <p className="mt-1 font-semibold text-leaf-700">{formatMoney(d.driver_payout_cents)}{d.tip_cents > 0 && ` + ${formatMoney(d.tip_cents)} tip`}</p>
                </div>
                <Button loading={busy === d.id + "accept"} onClick={() => act(d.id, "accept", "Job accepted")}>Accept</Button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
