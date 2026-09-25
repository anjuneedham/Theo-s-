"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bike, ShoppingBag, Phone, MapPin, RefreshCw, StickyNote, CalendarClock } from "lucide-react";
import type { Order, OrderItem, OrderStatus } from "@/lib/types";
import { StatusPill, PaymentPill, PAYMENT_METHOD_LABELS } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { statusLabel } from "@/lib/order-status";
import { api } from "@/lib/api-client";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/ui/primitives";

export interface BoardOrder {
  order: Order;
  items: OrderItem[];
  actions: OrderStatus[];
  restaurantName?: string;
}

const ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  confirmed: "Accept order",
  preparing: "Start preparing",
  ready: "Mark ready",
  out_for_delivery: "Out for delivery",
  delivered: "Complete",
  cancelled: "Reject / cancel",
};

const FILTERS = [
  ["active", "Active"],
  ["pending", "New"],
  ["delivered", "Completed"],
  ["cancelled", "Cancelled"],
  ["all", "All"],
] as const;

export function OrderBoard({ orders, detailBase }: { orders: BoardOrder[]; detailBase?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const filter = params.get("status") ?? "active";
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => router.refresh(), 20000);
    return () => clearInterval(t);
  }, [router]);

  async function act(o: Order, to: OrderStatus) {
    let note: string | null = null;
    if (to === "cancelled") {
      note = prompt("Reason for cancelling (shown to the customer):", "Item unavailable") ?? null;
      if (note === null) return;
    }
    setBusy(o.id + to);
    try {
      await api(`/api/v1/orders/${o.id}/status`, { method: "PATCH", body: { status: to, note } });
      toast.success(`${o.order_number}: ${statusLabel(to, o.fulfillment_type)}`);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {FILTERS.map(([v, l]) => (
            <Link key={v} href={`${pathname}?status=${v}`} className={cn("shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold", filter === v ? "bg-night-900 text-cream-50" : "bg-white text-night-700 ring-1 ring-cream-300")}>
              {l}
            </Link>
          ))}
        </div>
        <button onClick={() => router.refresh()} className="inline-flex items-center gap-1.5 text-sm font-semibold text-night-600 hover:text-night-900">
          <RefreshCw className="size-4" /> Auto-refreshes every 20s
        </button>
      </div>
      {orders.length === 0 ? (
        <EmptyState title="No orders here" icon={<ShoppingBag className="size-6" />}>New orders appear automatically.</EmptyState>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {orders.map(({ order: o, items, actions, restaurantName }) => (
            <article key={o.id} className={cn("card flex flex-col p-5", o.status === "pending" && "ring-2 ring-gold-400")}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="flex items-center gap-2 font-bold">
                    {o.fulfillment_type === "delivery" ? <Bike className="size-4 text-ember-500" /> : <ShoppingBag className="size-4 text-ember-500" />}
                    {detailBase ? <Link href={`${detailBase}/${o.id}`} className="hover:underline">{o.order_number}</Link> : o.order_number}
                    <span className="text-sm font-normal text-night-600">· {new Date(o.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Jamaica" })}</span>
                  </p>
                  {restaurantName && <p className="text-xs font-semibold text-clay-500">{restaurantName}</p>}
                </div>
                <StatusPill status={o.status} fulfillment={o.fulfillment_type} />
              </div>
              {o.scheduled_for && (
                <p className="mt-2 inline-flex items-center gap-1.5 self-start rounded-full bg-gold-300/40 px-2.5 py-1 text-xs font-bold text-gold-600">
                  <CalendarClock className="size-3.5" /> Scheduled {new Date(o.scheduled_for).toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit", timeZone: "America/Jamaica" })}
                </p>
              )}
              <ul className="mt-3 space-y-1 text-sm">
                {items.map((i) => (
                  <li key={i.id}>
                    <span className="font-bold">{i.quantity}×</span> {i.name}
                    {i.modifiers.length > 0 && <span className="text-night-600"> — {i.modifiers.map((m) => m.name).join(", ")}</span>}
                    {i.special_instructions && <span className="block pl-5 text-xs italic text-ember-700">“{i.special_instructions}”</span>}
                  </li>
                ))}
              </ul>
              {o.notes && <p className="mt-2 flex gap-1.5 rounded-lg bg-cream-100 px-3 py-2 text-xs"><StickyNote className="size-3.5 shrink-0" /> {o.notes}</p>}
              <div className="mt-3 space-y-1 border-t border-cream-200 pt-3 text-xs text-night-700">
                <p className="flex items-center gap-1.5"><Phone className="size-3.5" /> {o.contact_name} · <a href={`tel:${o.contact_phone.replace(/[^\d+]/g, "")}`} className="underline">{o.contact_phone}</a></p>
                {o.delivery_address && <p className="flex items-start gap-1.5"><MapPin className="mt-0.5 size-3.5 shrink-0" /> {[o.delivery_address.line1, o.delivery_address.line2, o.delivery_address.area].filter(Boolean).join(", ")}{o.delivery_address.instructions ? ` — ${o.delivery_address.instructions}` : ""}</p>}
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-night-900">{formatMoney(o.total_cents, o.currency)}</span> · {PAYMENT_METHOD_LABELS[o.payment_method]} <PaymentPill status={o.payment_status} />
                </p>
              </div>
              {actions.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {actions.map((a) => (
                    <Button key={a} size="sm" variant={a === "cancelled" ? "danger" : "primary"} loading={busy === o.id + a} onClick={() => act(o, a)}>
                      {ACTION_LABELS[a] ?? statusLabel(a, o.fulfillment_type)}
                    </Button>
                  ))}
                </div>
              )}
              {o.fulfillment_type === "delivery" && o.status === "ready" && !actions.includes("out_for_delivery") && (
                <p className="mt-3 text-xs text-night-600">Waiting for a driver to pick up.</p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
