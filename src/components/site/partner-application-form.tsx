"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Select, Textarea, Checkbox } from "@/components/ui/primitives";
import { api, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/cn";

const PARISHES = ["Kingston", "St. Andrew", "St. Catherine", "Clarendon", "Manchester", "St. Elizabeth", "Westmoreland", "Hanover", "St. James", "Trelawny", "St. Ann", "St. Mary", "Portland", "St. Thomas"];

export function PartnerApplicationForm({ user, regions, categories, plans, initialPlan }: { user: { name: string; email: string; phone: string | null } | null; regions: { id: string; name: string }[]; categories: { id: string; name: string }[]; plans: { id: string; slug: string; name: string }[]; initialPlan?: string }) {
  const [f, setF] = useState({
    restaurant_name: "",
    contact_name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    password: "",
    city: "",
    parish: "",
    region_id: "",
    address_line: "",
    description: "",
    plan_id: plans.find((p) => p.slug === initialPlan)?.id ?? plans[0]?.id ?? "",
    accepts_delivery: true,
    cuisine_category_ids: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  if (done)
    return (
      <div className="card mt-8 flex flex-col items-center p-10 text-center">
        <CheckCircle2 className="size-12 text-leaf-500" />
        <h2 className="mt-4 text-2xl">Application received</h2>
        <p className="mt-2 max-w-md text-night-600">{done}</p>
        <ButtonLink href="/partner" className="mt-6">Go to partner dashboard</ButtonLink>
      </div>
    );

  return (
    <form
      noValidate
      className="card mt-8 grid gap-5 p-6 sm:grid-cols-2 sm:p-8"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const res = await api<{ message?: string }>("/api/v1/partner/apply", {
            body: { ...f, region_id: f.region_id || null, address_line: f.address_line || null, description: f.description || null, plan_id: f.plan_id || null, password: user ? undefined : f.password },
          });
          setDone(res.message ?? "Thanks! Your restaurant is pending review. You can start adding your menu in the partner dashboard while we review it.");
        } catch (err) {
          if (err instanceof ApiError) setErrors(err.fields ?? { _: err.message });
        } finally {
          setBusy(false);
        }
      }}
    >
      {errors._ && <p className="rounded-xl bg-ember-50 px-4 py-3 text-sm text-ember-700 sm:col-span-2" role="alert">{errors._}</p>}
      <Field label="Restaurant name" htmlFor="p-name" error={errors.restaurant_name} className="sm:col-span-2"><Input id="p-name" value={f.restaurant_name} onChange={set("restaurant_name")} /></Field>
      <Field label="Your name" htmlFor="p-contact" error={errors.contact_name}><Input id="p-contact" autoComplete="name" value={f.contact_name} onChange={set("contact_name")} /></Field>
      <Field label="Phone" htmlFor="p-phone" error={errors.phone}><Input id="p-phone" type="tel" autoComplete="tel" value={f.phone} onChange={set("phone")} /></Field>
      <Field label="Email" htmlFor="p-email" error={errors.email}><Input id="p-email" type="email" autoComplete="email" value={f.email} onChange={set("email")} disabled={Boolean(user)} /></Field>
      {!user && <Field label="Create a password" htmlFor="p-pass" error={errors.password} hint="For your partner dashboard login"><Input id="p-pass" type="password" autoComplete="new-password" value={f.password} onChange={set("password")} /></Field>}
      <Field label="Town / city" htmlFor="p-city" error={errors.city}><Input id="p-city" value={f.city} onChange={set("city")} /></Field>
      <Field label="Parish" htmlFor="p-parish" error={errors.parish}>
        <Select id="p-parish" value={f.parish} onChange={set("parish")}><option value="">Choose…</option>{PARISHES.map((p) => <option key={p}>{p}</option>)}</Select>
      </Field>
      <Field label="Delivery region" htmlFor="p-region">
        <Select id="p-region" value={f.region_id} onChange={set("region_id")}><option value="">Other / not listed</option>{regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</Select>
      </Field>
      <Field label="Street address" htmlFor="p-addr"><Input id="p-addr" value={f.address_line} onChange={set("address_line")} /></Field>
      <fieldset className="sm:col-span-2">
        <legend className="text-sm font-semibold">Cuisine (up to 5)</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {categories.map((c) => {
            const on = f.cuisine_category_ids.includes(c.id);
            return (
              <button type="button" key={c.id} aria-pressed={on} onClick={() => setF({ ...f, cuisine_category_ids: on ? f.cuisine_category_ids.filter((x) => x !== c.id) : [...f.cuisine_category_ids, c.id].slice(0, 5) })} className={cn("rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1", on ? "bg-night-900 text-cream-50 ring-night-900" : "bg-white ring-cream-300")}>
                {c.name}
              </button>
            );
          })}
        </div>
      </fieldset>
      <Field label="Tell us about your food" htmlFor="p-desc" className="sm:col-span-2"><Textarea id="p-desc" value={f.description} onChange={set("description")} /></Field>
      <Field label="Plan" htmlFor="p-plan">
        <Select id="p-plan" value={f.plan_id} onChange={set("plan_id")}>{plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
      </Field>
      <div className="flex items-end"><Checkbox label="We'd like delivery through the network" checked={f.accepts_delivery} onChange={(e) => setF({ ...f, accepts_delivery: e.target.checked })} /></div>
      <Button type="submit" size="lg" loading={busy} className="sm:col-span-2 sm:justify-self-start">Submit application</Button>
    </form>
  );
}
