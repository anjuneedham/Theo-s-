"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, Phone, MessageCircle, Bike, ShoppingBag, MapPin, RotateCcw, PartyPopper, Star, XCircle, AlertCircle } from "lucide-react";
import type { OrderDetail } from "@/lib/services/orders";
import { timelineFor, statusLabel, STATUS_CUSTOMER_COPY, isActiveStatus } from "@/lib/order-status";
import { StatusPill, PaymentPill, PAYMENT_METHOD_LABELS } from "@/components/ui/status-pill";
import { Button, ButtonLink } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/cn";
import { api } from "@/lib/api-client";
import { toast } from "@/components/ui/toast";
import { useCart } from "@/components/cart/cart-store";
import { Textarea } from "@/components/ui/primitives";

function fmtTime(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Jamaica" });
}

export function OrderTracker({
  initial,
  token,
  canCancel: initialCanCancel,
  canReview,
  justPlaced,
  paymentCancelled,
}: {
  initial: OrderDetail;
  token: string | null;
  canCancel: boolean;
  canReview: boolean;
  justPlaced: boolean;
  paymentCancelled: boolean;
}) {
  const router = useRouter();
  const [detail, setDetail] = useState(initial);
  const [canCancel, setCanCancel] = useState(initialCanCancel);
  const [busy, setBusy] = useState(false);
  const addToCart = useCart((s) => s.add);
  const { order, items, history, restaurant, driver, zone } = detail;
  const qs = token ? `?token=${encodeURIComponent(token)}` : "";

  // Poll for status updates while the order is active. (Swap for Supabase Realtime later.)
  useEffect(() => {
    if (!isActiveStatus(order.status)) return;
    const t = setInterval(async () => {
      try {
        const next = await api<OrderDetail & { actions: string[] }>(`/api/v1/orders/${order.id}${qs}`);
        setDetail((d) => ({ ...d, ...next, order: { ...d.order, ...next.order } }));
        setCanCancel(next.actions.includes("cancelled") && initialCanCancel);
      } catch {
        // keep last known state
      }
    }, 15000);
    return () => clearInterval(t);
  }, [order.id, order.status, qs, initialCanCancel]);

  async function cancel() {
    if (!confirm("Cancel this order?")) return;
    setBusy(true);
    try {
      await api(`/api/v1/orders/${order.id}/status${qs}`, { method: "PATCH", body: { status: "cancelled", note: "Cancelled by customer" } });
      toast.success("Your order was cancelled");
      setDetail((d) => ({ ...d, order: { ...d.order, status: "cancelled" } }));
      setCanCancel(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function reorder() {
    setBusy(true);
    try {
      const res = await api<{ restaurant: Parameters<typeof addToCart>[0]; lines: Parameters<typeof addToCart>[1][]; unavailable: string[] }>(`/api/v1/orders/${order.id}/reorder${qs}`, { method: "POST" });
      useCart.getState().clear();
      res.lines.forEach((l) => addToCart(res.restaurant, l));
      if (res.unavailable.length) toast.error(`No longer available: ${res.unavailable.join(", ")}`);
      else toast.success("Added to your cart");
      router.push("/cart");
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(false);
    }
  }

  const steps = timelineFor(order.fulfillment_type);
  const currentIndex = order.status === "cancelled" ? -1 : steps.indexOf(order.status);
  const eta = order.fulfillment_type === "delivery" ? order.estimated_delivery_at : order.estimated_ready_at;
  const active = isActiveStatus(order.status);

  return (
    <div className="container-page max-w-5xl py-8 pb-32 lg:py-12">
      {justPlaced && order.status !== "cancelled" && (
        <div className="mb-6 flex animate-fade-up items-center gap-4 rounded-3xl bg-leaf-600 p-5 text-white">
          <PartyPopper className="size-8 shrink-0 text-gold-300" />
          <div>
            <p className="text-lg font-bold">Thank you, {order.contact_name.split(" ")[0]}! Your order is in.</p>
            <p className="text-sm text-white/85">Bookmark this page to track it{order.contact_email ? " — we've also emailed you the link" : ""}.</p>
          </div>
        </div>
      )}
      {paymentCancelled && order.payment_status !== "paid" && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-ember-100 bg-ember-50 p-4 text-sm text-ember-700">
          <AlertCircle className="size-5" /> Online payment wasn&apos;t completed, so this order won&apos;t be prepared. You can place it again and choose to pay on delivery.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className="card overflow-hidden">
            <div className="bg-night-900 p-6 text-cream-50 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-cream-200/70">Order {order.order_number}</p>
                <StatusPill status={order.status} fulfillment={order.fulfillment_type} />
              </div>
              <h1 className="mt-4 text-3xl leading-tight sm:text-4xl">
                {order.status === "cancelled" ? "Order cancelled" : statusLabel(order.status, order.fulfillment_type)}
              </h1>
              <p className="mt-2 text-cream-200/80">
                {order.status === "ready" && order.fulfillment_type === "pickup" ? "Your order is ready for pickup." : STATUS_CUSTOMER_COPY[order.status]}
                {order.cancel_reason && order.status === "cancelled" && ` Reason: ${order.cancel_reason}.`}
              </p>
              {active && eta && (
                <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-cream-50/10 px-4 py-2 text-sm">
                  {order.fulfillment_type === "delivery" ? <Bike className="size-4 text-gold-400" /> : <ShoppingBag className="size-4 text-gold-400" />}
                  {order.scheduled_for ? "Scheduled · " : "Estimated "}
                  {order.fulfillment_type === "delivery" ? "arrival" : "ready"} by <strong>{fmtTime(eta)}</strong>
                </p>
              )}
            </div>
            {order.status !== "cancelled" && (
              <ol className="p-6 sm:p-8">
                {steps.map((s, i) => {
                  const done = i <= currentIndex;
                  const when = history.find((h) => h.status === s)?.created_at ?? null;
                  return (
                    <li key={s} className="relative flex gap-4 pb-6 last:pb-0">
                      {i < steps.length - 1 && <span className={cn("absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5", i < currentIndex ? "bg-leaf-500" : "bg-cream-200")} aria-hidden />}
                      <span className={cn("relative grid size-8 shrink-0 place-items-center rounded-full", done ? "bg-leaf-500 text-white" : "bg-cream-200 text-night-600", i === currentIndex && active && "ring-4 ring-leaf-500/20")}>
                        {done ? <Check className="size-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                      </span>
                      <div className="pt-1">
                        <p className={cn("font-semibold", !done && "text-night-600")}>{statusLabel(s, order.fulfillment_type)}</p>
                        {when && <p className="text-xs text-night-600">{fmtTime(when)}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          {driver && order.status === "out_for_delivery" && (
            <section className="card flex items-center gap-4 p-5">
              <span className="grid size-12 place-items-center rounded-full bg-ember-50 text-ember-600"><Bike className="size-6" /></span>
              <div className="flex-1">
                <p className="font-bold">{driver.full_name} is on the way</p>
                <p className="text-sm text-night-600">{driver.vehicle_type}</p>
              </div>
              <a href={`tel:${driver.phone.replace(/[^\d+]/g, "")}`} className="grid size-11 place-items-center rounded-full border border-cream-300 hover:bg-cream-100" aria-label="Call driver">
                <Phone className="size-4" />
              </a>
            </section>
          )}

          {canReview && <ReviewForm orderId={order.id} restaurantName={restaurant?.name ?? "the restaurant"} />}
        </div>

        <aside className="space-y-6">
          <section className="card p-6">
            <h2 className="font-sans text-lg font-bold">{restaurant?.name}</h2>
            <p className="mt-1 flex items-start gap-2 text-sm text-night-600">
              {order.fulfillment_type === "delivery" ? <MapPin className="mt-0.5 size-4 shrink-0" /> : <ShoppingBag className="mt-0.5 size-4 shrink-0" />}
              {order.fulfillment_type === "delivery" && order.delivery_address
                ? [order.delivery_address.line1, order.delivery_address.line2, order.delivery_address.area].filter(Boolean).join(", ") + (zone ? ` · ${zone.name}` : "")
                : `Pickup at ${[restaurant?.address_line, restaurant?.city].filter(Boolean).join(", ") || restaurant?.name}`}
            </p>
            <div className="mt-4 flex gap-2">
              {restaurant?.phone && (
                <a href={`tel:${restaurant.phone.replace(/[^\d+]/g, "")}`} className="inline-flex h-10 items-center gap-2 rounded-full border border-cream-300 px-4 text-sm font-semibold hover:bg-cream-100">
                  <Phone className="size-4" /> Call
                </a>
              )}
              {restaurant?.whatsapp && (
                <a href={`https://wa.me/${restaurant.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, about my order ${order.order_number}`)}`} target="_blank" rel="noopener" className="inline-flex h-10 items-center gap-2 rounded-full border border-cream-300 px-4 text-sm font-semibold hover:bg-cream-100">
                  <MessageCircle className="size-4" /> WhatsApp
                </a>
              )}
            </div>
          </section>

          <section className="card p-6">
            <h2 className="font-sans text-lg font-bold">Your order</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {items.map((i) => (
                <li key={i.id} className="flex justify-between gap-3">
                  <span>
                    <span className="font-semibold">{i.quantity}×</span> {i.name}
                    {i.modifiers.length > 0 && <span className="block text-xs text-night-600">{i.modifiers.map((m) => m.name).join(", ")}</span>}
                    {i.special_instructions && <span className="block text-xs italic text-night-600">“{i.special_instructions}”</span>}
                  </span>
                  <span className="shrink-0 tabular-nums">{formatMoney(i.line_total_cents, order.currency)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-cream-200 pt-4 text-sm">
              <SumRow label="Subtotal" cents={order.subtotal_cents} currency={order.currency} />
              {order.discount_cents > 0 && <SumRow label="Discount" cents={-order.discount_cents} currency={order.currency} />}
              {order.delivery_fee_cents > 0 && <SumRow label="Delivery" cents={order.delivery_fee_cents} currency={order.currency} />}
              {order.service_fee_cents > 0 && <SumRow label="Service fee" cents={order.service_fee_cents} currency={order.currency} />}
              {order.tip_cents > 0 && <SumRow label="Tip" cents={order.tip_cents} currency={order.currency} />}
              <div className="flex justify-between border-t border-cream-200 pt-2 text-base font-bold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatMoney(order.total_cents, order.currency)}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-night-600">
              <PaymentPill status={order.payment_status} /> {PAYMENT_METHOD_LABELS[order.payment_method]}
            </div>
          </section>

          <div className="flex flex-col gap-2">
            {!active && (
              <Button onClick={reorder} loading={busy} size="lg">
                <RotateCcw className="size-4" /> Order again
              </Button>
            )}
            {canCancel && order.status === "pending" && (
              <Button variant="danger" onClick={cancel} loading={busy}>
                <XCircle className="size-4" /> Cancel order
              </Button>
            )}
            <ButtonLink href="/account/orders" variant="ghost">All my orders</ButtonLink>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SumRow({ label, cents, currency }: { label: string; cents: number; currency: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-night-600">{label}</dt>
      <dd className="tabular-nums">{formatMoney(cents, currency)}</dd>
    </div>
  );
}

function ReviewForm({ orderId, restaurantName }: { orderId: string; restaurantName: string }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  if (done) return <section className="card p-6 text-center font-semibold text-leaf-700">Thanks for your review!</section>;
  return (
    <section className="card p-6">
      <h2 className="font-sans text-lg font-bold">How was your meal from {restaurantName}?</h2>
      <div className="mt-3 flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} role="radio" aria-checked={rating === i} aria-label={`${i} star${i > 1 ? "s" : ""}`} onClick={() => setRating(i)} className="p-1">
            <Star className={cn("size-8", i <= rating ? "fill-gold-400 text-gold-400" : "text-cream-300")} />
          </button>
        ))}
      </div>
      <Textarea className="mt-3" placeholder="Tell others what you enjoyed (optional)" value={comment} onChange={(e) => setComment(e.target.value)} aria-label="Review" />
      <Button
        className="mt-3"
        disabled={!rating}
        loading={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await api("/api/v1/reviews", { body: { order_id: orderId, rating, comment: comment || null } });
            setDone(true);
          } catch (e) {
            toast.error((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        Submit review
      </Button>
      <p className="mt-2 text-xs text-night-600">
        Reviews are shown with your first name and last initial. See our <Link href="/privacy" className="underline">privacy policy</Link>.
      </p>
    </section>
  );
}
