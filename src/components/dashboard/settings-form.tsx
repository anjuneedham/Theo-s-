"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PaymentMethod, PlatformSettings } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field, Input, Checkbox } from "@/components/ui/primitives";
import { Panel } from "./widgets";
import { api, ApiError } from "@/lib/api-client";
import { toast } from "@/components/ui/toast";
import { formatMoney, parseMoneyInput } from "@/lib/money";
import { computeTotals } from "@/lib/pricing";

const pctToBps = (v: string) => Math.round(Number(v || 0) * 100);
const bpsToPct = (b: number) => String(b / 100);
const c2s = (c: number) => String(c / 100);

export function SettingsForm({ initial }: { initial: PlatformSettings }) {
  const router = useRouter();
  const [f, setF] = useState({
    platform_name: initial.platform_name, currency: initial.currency,
    default_commission: bpsToPct(initial.default_commission_bps), service_fee: bpsToPct(initial.service_fee_bps),
    service_fee_min: c2s(initial.service_fee_min_cents), service_fee_max: c2s(initial.service_fee_max_cents), service_fee_on_anchor: initial.service_fee_on_anchor,
    tax_rate: bpsToPct(initial.tax_rate_bps), tax_inclusive: initial.tax_inclusive,
    driver_base: c2s(initial.driver_base_payout_cents), driver_share: bpsToPct(initial.driver_fee_share_bps),
    payment_methods: initial.payment_methods, allow_guest_checkout: initial.allow_guest_checkout,
    support_email: initial.support_email, support_phone: initial.support_phone,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const payload = {
    platform_name: f.platform_name, currency: f.currency.toUpperCase(),
    default_commission_bps: pctToBps(f.default_commission), service_fee_bps: pctToBps(f.service_fee),
    service_fee_min_cents: parseMoneyInput(f.service_fee_min || "0") ?? 0, service_fee_max_cents: parseMoneyInput(f.service_fee_max || "0") ?? 0, service_fee_on_anchor: f.service_fee_on_anchor,
    tax_rate_bps: pctToBps(f.tax_rate), tax_inclusive: f.tax_inclusive,
    driver_base_payout_cents: parseMoneyInput(f.driver_base || "0") ?? 0, driver_fee_share_bps: pctToBps(f.driver_share),
    payment_methods: f.payment_methods, allow_guest_checkout: f.allow_guest_checkout,
    support_email: f.support_email, support_phone: f.support_phone,
  };

  // Worked example so admins can see what a rate change means for a real order.
  let example: ReturnType<typeof computeTotals> | null = null;
  try {
    example = computeTotals({ lines: [{ line_total_cents: 400000 }], fulfillment: "delivery", zone: { fee_cents: 70000, min_order_cents: 0 }, restaurant: { min_order_cents: 0, is_anchor: false }, commissionBps: payload.default_commission_bps, settings: payload });
  } catch {
    example = null;
  }

  const toggleMethod = (m: PaymentMethod) => setF({ ...f, payment_methods: f.payment_methods.includes(m) ? f.payment_methods.filter((x) => x !== m) : [...f.payment_methods, m] });

  return (
    <form
      className="grid gap-6 xl:grid-cols-[1.4fr_1fr]"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await api("/api/v1/admin/settings", { method: "PATCH", body: payload });
          setErrors({});
          toast.success("Settings saved");
          router.refresh();
        } catch (err) {
          if (err instanceof ApiError) setErrors(err.fields ?? {});
          toast.error((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="space-y-6">
        <Panel title="Commission & customer fees">
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Default partner commission (%)" htmlFor="s-comm" error={errors.default_commission_bps} hint="Used when a restaurant has no plan or override"><Input id="s-comm" inputMode="decimal" value={f.default_commission} onChange={set("default_commission")} /></Field>
            <Field label="Customer service fee (%)" htmlFor="s-svc" error={errors.service_fee_bps}><Input id="s-svc" inputMode="decimal" value={f.service_fee} onChange={set("service_fee")} /></Field>
            <Field label="Service fee minimum" htmlFor="s-min" error={errors.service_fee_min_cents}><Input id="s-min" inputMode="decimal" value={f.service_fee_min} onChange={set("service_fee_min")} /></Field>
            <Field label="Service fee maximum (0 = none)" htmlFor="s-max" error={errors.service_fee_max_cents}><Input id="s-max" inputMode="decimal" value={f.service_fee_max} onChange={set("service_fee_max")} /></Field>
            <Checkbox className="sm:col-span-2" label="Also charge the service fee on direct Theo's orders" checked={f.service_fee_on_anchor} onChange={(e) => setF({ ...f, service_fee_on_anchor: e.target.checked })} />
          </div>
        </Panel>
        <Panel title="Tax">
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Tax rate (%)" htmlFor="s-tax" error={errors.tax_rate_bps} hint="GCT — confirm the correct rate with your accountant"><Input id="s-tax" inputMode="decimal" value={f.tax_rate} onChange={set("tax_rate")} /></Field>
            <div className="flex items-end"><Checkbox label="Menu prices include tax" checked={f.tax_inclusive} onChange={(e) => setF({ ...f, tax_inclusive: e.target.checked })} /></div>
          </div>
        </Panel>
        <Panel title="Driver pay">
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Base payout per delivery" htmlFor="s-dbase" error={errors.driver_base_payout_cents}><Input id="s-dbase" inputMode="decimal" value={f.driver_base} onChange={set("driver_base")} /></Field>
            <Field label="Share of delivery fee to driver (%)" htmlFor="s-dshare" error={errors.driver_fee_share_bps}><Input id="s-dshare" inputMode="decimal" value={f.driver_share} onChange={set("driver_share")} /></Field>
          </div>
        </Panel>
        <Panel title="Checkout & support">
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <fieldset className="sm:col-span-2">
              <legend className="text-sm font-semibold">Payment methods offered</legend>
              <div className="mt-2 flex flex-wrap gap-4">
                {(["cash", "card_on_delivery", "online"] as const).map((m) => <Checkbox key={m} label={m.replace(/_/g, " ")} checked={f.payment_methods.includes(m)} onChange={() => toggleMethod(m)} />)}
              </div>
              <p className="mt-1 text-xs text-night-600">“Online” only appears at checkout once a payment provider is connected.</p>
            </fieldset>
            <Checkbox className="sm:col-span-2" label="Allow guest checkout" checked={f.allow_guest_checkout} onChange={(e) => setF({ ...f, allow_guest_checkout: e.target.checked })} />
            <Field label="Platform name" htmlFor="s-name" error={errors.platform_name}><Input id="s-name" value={f.platform_name} onChange={set("platform_name")} /></Field>
            <Field label="Currency (ISO)" htmlFor="s-cur" error={errors.currency}><Input id="s-cur" value={f.currency} onChange={set("currency")} maxLength={3} /></Field>
            <Field label="Support email" htmlFor="s-email" error={errors.support_email}><Input id="s-email" value={f.support_email} onChange={set("support_email")} /></Field>
            <Field label="Support phone" htmlFor="s-phone" error={errors.support_phone}><Input id="s-phone" value={f.support_phone} onChange={set("support_phone")} /></Field>
          </div>
        </Panel>
        <Button type="submit" size="lg" loading={busy}>Save settings</Button>
      </div>
      <aside className="xl:sticky xl:top-8 xl:self-start">
        <Panel title="Worked example">
          <div className="p-5 text-sm">
            <p className="text-night-600">A partner-restaurant delivery order: J$4,000 food, J$700 delivery fee, no discount.</p>
            {example ? (
              <dl className="mt-4 space-y-2">
                {[
                  ["Customer pays", example.total_cents, true],
                  ["→ Restaurant payout", example.restaurant_payout_cents],
                  ["→ Driver payout", example.driver_payout_cents],
                  ["→ Platform: commission", example.commission_cents],
                  ["→ Platform: service fee", example.service_fee_cents],
                  ["→ Platform: delivery margin", example.delivery_revenue_cents],
                  ["Platform revenue", example.platform_revenue_cents, true],
                ].map(([l, v, strong]) => (
                  <div key={l as string} className={`flex justify-between ${strong ? "font-bold" : ""}`}><dt>{l}</dt><dd className="tabular-nums">{formatMoney(v as number)}</dd></div>
                ))}
              </dl>
            ) : <p className="mt-4 text-ember-700">Check the values above.</p>}
            <p className="mt-4 text-xs text-night-600">Illustrative only — these rates are business assumptions to be validated, not projections.</p>
          </div>
        </Panel>
      </aside>
    </form>
  );
}
