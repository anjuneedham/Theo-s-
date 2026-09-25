"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Bike, ShoppingBag, MapPin, LocateFixed, Clock, Tag, Lock, AlertCircle, Banknote, CreditCard, Smartphone } from "lucide-react";
import { useCart } from "@/components/cart/cart-store";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Select, Textarea, Checkbox, EmptyState } from "@/components/ui/primitives";
import { PAYMENT_METHOD_LABELS } from "@/components/ui/status-pill";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/cn";
import { api, ApiError } from "@/lib/api-client";
import { track } from "@/lib/analytics-client";
import type { DeliveryAddress, PaymentMethod } from "@/lib/types";

interface Quote {
  totals: { subtotal_cents: number; discount_cents: number; delivery_fee_cents: number; service_fee_cents: number; tax_cents: number; tip_cents: number; total_cents: number };
  zone: { name: string; min_minutes: number; max_minutes: number } | null;
  promotion: { code: string | null; title: string } | null;
  promo_message: string | null;
  is_open: boolean;
  prep_time_minutes: number;
  currency: string;
}

const subscribe = () => () => undefined;
const TIPS = [0, 20000, 30000, 50000];
const PAYMENT_ICONS = { cash: Banknote, card_on_delivery: CreditCard, online: Smartphone };

export function CheckoutForm({
  user,
  addresses,
  paymentMethods,
  allowGuest,
  areasByRestaurant,
}: {
  user: { name: string; email: string; phone: string | null } | null;
  addresses: DeliveryAddress[];
  paymentMethods: PaymentMethod[];
  allowGuest: boolean;
  areasByRestaurant: Record<string, string[]>;
}) {
  const router = useRouter();
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const { lines, restaurant, fulfillment, setFulfillment, area: cartArea, clear } = useCart();

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const defaultAddress = addresses.find((a) => a.is_default) ?? addresses[0];
  const [addressId, setAddressId] = useState<string>(defaultAddress?.id ?? "new");
  const [area, setArea] = useState(cartArea ?? "");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [instructions, setInstructions] = useState("");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [saveAddress, setSaveAddress] = useState(true);
  const [when, setWhen] = useState<"asap" | "later">("asap");
  const [scheduledFor, setScheduledFor] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>(paymentMethods[0] ?? "cash");
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<string | null>(null);
  const [tip, setTip] = useState(0);
  const [notes, setNotes] = useState("");
  const [rawQuote, setQuote] = useState<Quote | null>(null);
  const [rawQuoteError, setQuoteError] = useState<string | null>(null);
  const [minLocal] = useState(() => {
    const d = new Date(Date.now() + 30 * 60000);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const idempotencyKey = useRef<string>("");

  useEffect(() => {
    idempotencyKey.current = crypto.randomUUID();
    if (restaurant) track("checkout_started", { restaurant_id: restaurant.id });
  }, [restaurant]);

  const saved = addresses.find((a) => a.id === addressId);
  const effectiveArea = fulfillment === "delivery" ? (saved ? saved.area : area) : null;
  const areas = restaurant ? areasByRestaurant[restaurant.id] ?? [] : [];
  const tipCents = fulfillment === "delivery" ? tip : 0;

  const quoteBody = useMemo(
    () =>
      restaurant && lines.length
        ? {
            restaurant_id: restaurant.id,
            fulfillment_type: fulfillment,
            items: lines.map((l) => ({ menu_item_id: l.menu_item_id, quantity: l.quantity, modifier_ids: l.modifiers.map((m) => m.id), special_instructions: l.special_instructions })),
            area: effectiveArea || null,
            latitude: saved ? saved.latitude : coords?.latitude ?? null,
            longitude: saved ? saved.longitude : coords?.longitude ?? null,
            promo_code: promo,
            tip_cents: tipCents,
          }
        : null,
    [restaurant, lines, fulfillment, effectiveArea, saved, coords, promo, tipCents],
  );

  const needsLocation = Boolean(quoteBody && quoteBody.fulfillment_type === "delivery" && !quoteBody.area && quoteBody.latitude == null);
  const quote = needsLocation ? null : rawQuote;
  const quoteError = needsLocation ? null : rawQuoteError;

  // Live server-side quote (debounced) — the totals shown are exactly what will be charged.
  useEffect(() => {
    if (!quoteBody || needsLocation) return;
    const t = setTimeout(async () => {
      try {
        const q = await api<Quote>("/api/v1/quote", { body: quoteBody });
        setQuote(q);
        setQuoteError(null);
        if (!q.is_open) setWhen("later");
      } catch (e) {
        setQuote(null);
        setQuoteError((e as Error).message);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [quoteBody, needsLocation]);

  if (!hydrated) return <div className="container-page min-h-[60vh] py-16" aria-busy />;
  if (!restaurant || lines.length === 0) {
    return (
      <div className="container-page max-w-2xl py-16">
        <EmptyState icon={<ShoppingBag className="size-6" />} title="Nothing to check out yet" action={<ButtonLink href="/order">Browse the menu</ButtonLink>} />
      </div>
    );
  }
  if (!user && !allowGuest) {
    return (
      <div className="container-page max-w-2xl py-16">
        <EmptyState icon={<Lock className="size-6" />} title="Sign in to check out" action={<ButtonLink href="/login?next=/checkout">Sign in</ButtonLink>} />
      </div>
    );
  }

  function locate() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.contact_name = "Enter your name";
    if (phone.replace(/\D/g, "").length < 7) errs.contact_phone = "Enter a phone number we can reach you on";
    if (fulfillment === "delivery" && !saved) {
      if (!area && !coords) errs["address.area"] = "Choose your area";
      if (line1.trim().length < 3) errs["address.line1"] = "Enter your street address";
    }
    if (when === "later" && !scheduledFor) errs.scheduled_for = "Choose a time";
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.querySelector("[role=alert]")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!quoteBody) return;
    setSubmitting(true);
    try {
      const address =
        fulfillment === "delivery"
          ? saved
            ? { label: saved.label, line1: saved.line1, line2: saved.line2, area: saved.area, city: saved.city, parish: saved.parish, instructions: saved.instructions, latitude: saved.latitude, longitude: saved.longitude }
            : { label: null, line1, line2: line2 || null, area: area || "Pinned location", city: null, parish: null, instructions: instructions || null, latitude: coords?.latitude ?? null, longitude: coords?.longitude ?? null }
          : null;
      const res = await api<{ tracking_url: string; redirect_url: string | null }>("/api/v1/orders", {
        body: {
          ...quoteBody,
          contact_name: name,
          contact_phone: phone,
          contact_email: email || null,
          address,
          save_address: Boolean(user && !saved && saveAddress),
          notes: notes || null,
          payment_method: payment,
          scheduled_for: when === "later" && scheduledFor ? new Date(scheduledFor).toISOString() : null,
          idempotency_key: idempotencyKey.current,
        },
      });
      clear();
      if (res.redirect_url) window.location.href = res.redirect_url;
      else router.push(`${res.tracking_url}&new=1`);
    } catch (err) {
      setSubmitting(false);
      if (err instanceof ApiError) {
        if (err.fields) setErrors(err.fields);
        setQuoteError(err.message);
      } else setQuoteError("Something went wrong. Please try again.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }


  return (
    <form onSubmit={submit} className="container-page grid gap-8 py-8 pb-40 lg:grid-cols-[1fr_400px] lg:py-12" noValidate>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl">Checkout</h1>
          <p className="mt-1 text-night-600">
            Ordering from <strong className="text-night-900">{restaurant.name}</strong>
            {!user && (
              <>
                {" "}· <Link href="/login?next=/checkout" className="font-semibold text-ember-600 underline">Sign in</Link> to save addresses and see past orders
              </>
            )}
          </p>
        </div>

        {quoteError && (
          <div className="flex gap-3 rounded-2xl border border-ember-100 bg-ember-50 px-4 py-3 text-sm text-ember-700" role="alert">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <p>{quoteError}</p>
          </div>
        )}

        <Section title="How would you like it?">
          <div className="grid grid-cols-2 gap-3">
            {(["delivery", "pickup"] as const).map((f) => (
              <button
                type="button"
                key={f}
                onClick={() => setFulfillment(f)}
                aria-pressed={fulfillment === f}
                className={cn("flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition", fulfillment === f ? "border-ember-500 bg-ember-50/50" : "border-cream-200 bg-white hover:border-cream-300")}
              >
                {f === "delivery" ? <Bike className="size-6 text-ember-600" /> : <ShoppingBag className="size-6 text-ember-600" />}
                <span>
                  <span className="block font-bold capitalize">{f}</span>
                  <span className="block text-xs text-night-600">
                    {f === "delivery" ? (quote?.zone ? `${quote.zone.min_minutes + quote.prep_time_minutes}–${quote.zone.max_minutes + quote.prep_time_minutes} min` : "To your door") : `Ready in ~${quote?.prep_time_minutes ?? 25} min`}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Your details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="name" error={errors.contact_name}>
              <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label="Phone" htmlFor="phone" error={errors.contact_phone} hint="For order updates and the driver">
              <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="876 555 0123" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </Field>
            <Field label="Email (optional)" htmlFor="email" error={errors.contact_email} hint="We'll send your receipt here" className="sm:col-span-2">
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
          </div>
        </Section>

        {fulfillment === "delivery" && (
          <Section title="Delivery address">
            {addresses.length > 0 && (
              <div className="mb-4 space-y-2">
                {addresses.map((a) => (
                  <label key={a.id} className={cn("flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4", addressId === a.id ? "border-ember-500 bg-ember-50/40" : "border-cream-200 bg-white")}>
                    <input type="radio" name="address" checked={addressId === a.id} onChange={() => setAddressId(a.id)} className="mt-1 size-4 accent-ember-500" />
                    <span className="text-sm">
                      <span className="block font-bold">{a.label}</span>
                      <span className="text-night-600">{[a.line1, a.line2, a.area].filter(Boolean).join(", ")}</span>
                    </span>
                  </label>
                ))}
                <label className={cn("flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4", addressId === "new" ? "border-ember-500 bg-ember-50/40" : "border-cream-200 bg-white")}>
                  <input type="radio" name="address" checked={addressId === "new"} onChange={() => setAddressId("new")} className="size-4 accent-ember-500" />
                  <span className="text-sm font-bold">Use a new address</span>
                </label>
              </div>
            )}
            {!saved && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Area / community" htmlFor="area" error={errors["address.area"]} className="sm:col-span-2">
                  <div className="flex gap-2">
                    <Select id="area" value={area} onChange={(e) => setArea(e.target.value)} className="flex-1">
                      <option value="">Choose your area…</option>
                      {areas.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </Select>
                    <Button type="button" variant="secondary" onClick={locate} loading={locating} title="Use my current location" className="h-auto shrink-0 rounded-xl px-3.5">
                      <LocateFixed className="size-4" />
                      <span className="hidden sm:inline">{coords ? "Located" : "Locate me"}</span>
                    </Button>
                  </div>
                </Field>
                <Field label="Street address" htmlFor="line1" error={errors["address.line1"]} className="sm:col-span-2">
                  <Input id="line1" autoComplete="address-line1" placeholder="House number and street" value={line1} onChange={(e) => setLine1(e.target.value)} />
                </Field>
                <Field label="Apartment, complex (optional)" htmlFor="line2">
                  <Input id="line2" autoComplete="address-line2" value={line2} onChange={(e) => setLine2(e.target.value)} />
                </Field>
                <Field label="Directions for the driver (optional)" htmlFor="instructions">
                  <Input id="instructions" placeholder="Landmark, gate colour…" value={instructions} onChange={(e) => setInstructions(e.target.value)} />
                </Field>
                {user && <Checkbox label="Save this address for next time" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="sm:col-span-2" />}
              </div>
            )}
            {quote?.zone && (
              <p className="mt-4 flex items-center gap-2 text-sm text-leaf-700">
                <MapPin className="size-4" /> {quote.zone.name}: we deliver here.
              </p>
            )}
          </Section>
        )}

        <Section title="When?">
          <div className="flex flex-wrap gap-2">
            <Chip active={when === "asap"} onClick={() => setWhen("asap")} disabled={quote ? !quote.is_open : false}>
              <Clock className="size-4" /> As soon as possible
            </Chip>
            <Chip active={when === "later"} onClick={() => setWhen("later")}>Schedule for later</Chip>
          </div>
          {quote && !quote.is_open && <p className="mt-3 text-sm text-night-600">{restaurant.name} is closed right now — choose a time when it&apos;s open.</p>}
          {when === "later" && (
            <Field label="Date & time" htmlFor="scheduled" error={errors.scheduled_for} className="mt-4 max-w-xs">
              <Input id="scheduled" type="datetime-local" min={minLocal} value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} />
            </Field>
          )}
        </Section>

        <Section title="Payment">
          <div className="space-y-2">
            {paymentMethods.map((m) => {
              const Icon = PAYMENT_ICONS[m];
              return (
                <label key={m} className={cn("flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4", payment === m ? "border-ember-500 bg-ember-50/40" : "border-cream-200 bg-white")}>
                  <input type="radio" name="payment" checked={payment === m} onChange={() => setPayment(m)} className="size-4 accent-ember-500" />
                  <Icon className="size-5 text-night-700" />
                  <span className="text-sm font-bold">{PAYMENT_METHOD_LABELS[m]}</span>
                </label>
              );
            })}
          </div>
          {!paymentMethods.includes("online") && <p className="mt-3 text-xs text-night-600">Online card payments are coming soon. Pay with cash or card when you receive your order.</p>}
        </Section>

        {fulfillment === "delivery" && (
          <Section title="Tip your driver">
            <div className="flex flex-wrap gap-2">
              {TIPS.map((t) => (
                <Chip key={t} active={tip === t} onClick={() => setTip(t)}>
                  {t === 0 ? "No tip" : formatMoney(t, restaurant.currency)}
                </Chip>
              ))}
            </div>
            <p className="mt-2 text-xs text-night-600">100% of tips go to your driver.</p>
          </Section>
        )}

        <Section title="Anything else?">
          <Textarea aria-label="Order notes" placeholder="Notes for the kitchen (optional)" value={notes} onChange={(e) => setNotes(e.target.value.slice(0, 500))} />
        </Section>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="card overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl">Order summary</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {lines.map((l) => (
                <li key={l.key} className="flex justify-between gap-3">
                  <span className="min-w-0">
                    <span className="font-semibold">{l.quantity}×</span> {l.name}
                    {l.modifiers.length > 0 && <span className="block truncate text-xs text-night-600">{l.modifiers.map((m) => m.name).join(", ")}</span>}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex gap-2">
              <div className="relative flex-1">
                <Tag className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-night-600/60" />
                <Input aria-label="Promo code" placeholder="Promo code" value={promoInput} onChange={(e) => setPromoInput(e.target.value.toUpperCase())} className="h-11 py-0 pl-9 uppercase" />
              </div>
              <Button type="button" variant="secondary" onClick={() => setPromo(promoInput.trim() || null)} className="h-11 rounded-xl">
                Apply
              </Button>
            </div>
            {promo && quote?.promo_message && <p className="mt-2 text-xs font-semibold text-ember-700">{quote.promo_message}</p>}
            {quote?.promotion && <p className="mt-2 text-xs font-semibold text-leaf-700">✓ {quote.promotion.title}</p>}

            {quote ? (
              <dl className="mt-5 space-y-2 border-t border-cream-200 pt-4 text-sm">
                <Row label="Subtotal" value={formatMoney(quote.totals.subtotal_cents, quote.currency)} />
                {quote.totals.discount_cents > 0 && <Row label="Discount" value={`−${formatMoney(quote.totals.discount_cents, quote.currency)}`} className="text-leaf-700" />}
                {fulfillment === "delivery" && <Row label="Delivery fee" value={formatMoney(quote.totals.delivery_fee_cents, quote.currency)} />}
                {quote.totals.service_fee_cents > 0 && <Row label="Service fee" value={formatMoney(quote.totals.service_fee_cents, quote.currency)} />}
                {quote.totals.tip_cents > 0 && <Row label="Driver tip" value={formatMoney(quote.totals.tip_cents, quote.currency)} />}
                <div className="flex justify-between border-t border-cream-200 pt-3 text-base font-bold">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatMoney(quote.totals.total_cents, quote.currency)}</dd>
                </div>
                {quote.totals.tax_cents > 0 && <p className="text-xs text-night-600">Includes GCT of {formatMoney(quote.totals.tax_cents, quote.currency)}</p>}
              </dl>
            ) : (
              <p className="mt-5 border-t border-cream-200 pt-4 text-sm text-night-600">{fulfillment === "delivery" ? "Choose your area to see delivery fee and total." : "Calculating…"}</p>
            )}
          </div>
          <div className="border-t border-cream-200 bg-cream-50 p-6">
            <Button type="submit" size="lg" className="w-full justify-between" loading={submitting} disabled={!quote || submitting}>
              <span>Place order</span>
              {quote && <span className="tabular-nums">{formatMoney(quote.totals.total_cents, quote.currency)}</span>}
            </Button>
            <p className="mt-3 text-center text-xs text-night-600">
              By placing your order you agree to our <Link href="/terms" className="underline">terms</Link>. {payment !== "online" && "You'll pay when you receive your order."}
            </p>
          </div>
        </div>
      </aside>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="mb-4 font-sans text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Chip({ active, children, onClick, disabled }: { active: boolean; children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn("inline-flex h-11 items-center gap-2 rounded-full border-2 px-4 text-sm font-semibold transition disabled:opacity-40", active ? "border-night-900 bg-night-900 text-cream-50" : "border-cream-300 bg-white hover:border-night-600/40")}
    >
      {children}
    </button>
  );
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("flex justify-between", className)}>
      <dt className="text-night-600">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
