"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ImagePlus } from "lucide-react";
import type { Restaurant } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea, Checkbox } from "@/components/ui/primitives";
import { Panel } from "./widgets";
import { api, ApiError } from "@/lib/api-client";
import { toast } from "@/components/ui/toast";
import { parseMoneyInput } from "@/lib/money";

export function ProfileEditor({ restaurant: r }: { restaurant: Restaurant }) {
  const router = useRouter();
  const [f, setF] = useState({
    name: r.name, tagline: r.tagline ?? "", description: r.description ?? "", phone: r.phone ?? "", email: r.email ?? "", whatsapp: r.whatsapp ?? "",
    address_line: r.address_line ?? "", area: r.area ?? "", city: r.city ?? "", parish: r.parish ?? "",
    latitude: r.latitude?.toString() ?? "", longitude: r.longitude?.toString() ?? "",
    logo_url: r.logo_url ?? "", cover_url: r.cover_url ?? "",
    accepts_delivery: r.accepts_delivery, accepts_pickup: r.accepts_pickup,
    min_order: (r.min_order_cents / 100).toString(), prep_time_minutes: r.prep_time_minutes.toString(),
    social_instagram: r.social_instagram ?? "", social_facebook: r.social_facebook ?? "", social_tiktok: r.social_tiktok ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function upload(field: "logo_url" | "cover_url", file: File) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/v1/partner/${r.id}/upload`, { method: "POST", body: form });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error?.message ?? "Upload failed");
    setF((x) => ({ ...x, [field]: json.url }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const num = (v: string) => (v.trim() === "" ? null : Number(v));
    try {
      await api(`/api/v1/partner/${r.id}/profile`, {
        method: "PATCH",
        body: {
          ...f,
          latitude: num(f.latitude),
          longitude: num(f.longitude),
          min_order_cents: parseMoneyInput(f.min_order || "0") ?? 0,
          prep_time_minutes: Number(f.prep_time_minutes),
          min_order: undefined,
        },
      });
      setErrors({});
      toast.success("Profile saved");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fields ?? {});
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="grid gap-6 xl:grid-cols-2" noValidate>
      <Panel title="Basics">
        <div className="grid gap-4 p-5">
          <Field label="Restaurant name" htmlFor="rp-name" error={errors.name}><Input id="rp-name" value={f.name} onChange={set("name")} /></Field>
          <Field label="Tagline" htmlFor="rp-tag" error={errors.tagline}><Input id="rp-tag" value={f.tagline} onChange={set("tagline")} /></Field>
          <Field label="Description" htmlFor="rp-desc" error={errors.description}><Textarea id="rp-desc" rows={4} value={f.description} onChange={set("description")} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            {(["logo_url", "cover_url"] as const).map((k) => (
              <div key={k}>
                <p className="text-sm font-semibold">{k === "logo_url" ? "Logo" : "Cover image"}</p>
                <div className="mt-1.5 flex items-center gap-3">
                  <div className="size-14 overflow-hidden rounded-xl bg-cream-200">{/* eslint-disable-next-line @next/next/no-img-element -- preview of an arbitrary uploaded URL */}
                  {f[k] && <img src={f[k]} alt="" className="size-full object-cover" />}</div>
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-cream-300 px-3 py-1.5 text-sm font-semibold hover:bg-cream-100">
                    <ImagePlus className="size-4" /> Upload
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => e.target.files?.[0] && upload(k, e.target.files[0])} />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Panel>
      <Panel title="Contact & location">
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Phone" htmlFor="rp-phone"><Input id="rp-phone" value={f.phone} onChange={set("phone")} /></Field>
          <Field label="WhatsApp number" htmlFor="rp-wa"><Input id="rp-wa" value={f.whatsapp} onChange={set("whatsapp")} /></Field>
          <Field label="Email" htmlFor="rp-email" className="sm:col-span-2"><Input id="rp-email" type="email" value={f.email} onChange={set("email")} /></Field>
          <Field label="Street address" htmlFor="rp-addr" className="sm:col-span-2"><Input id="rp-addr" value={f.address_line} onChange={set("address_line")} /></Field>
          <Field label="Area" htmlFor="rp-area"><Input id="rp-area" value={f.area} onChange={set("area")} /></Field>
          <Field label="City" htmlFor="rp-city"><Input id="rp-city" value={f.city} onChange={set("city")} /></Field>
          <Field label="Parish" htmlFor="rp-parish"><Input id="rp-parish" value={f.parish} onChange={set("parish")} /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Latitude" htmlFor="rp-lat" error={errors.latitude}><Input id="rp-lat" inputMode="decimal" value={f.latitude} onChange={set("latitude")} /></Field>
            <Field label="Longitude" htmlFor="rp-lng" error={errors.longitude}><Input id="rp-lng" inputMode="decimal" value={f.longitude} onChange={set("longitude")} /></Field>
          </div>
          <p className="text-xs text-night-600 sm:col-span-2">Coordinates power radius-based delivery zones and the map link. Tip: long-press your location in Google Maps to copy them.</p>
        </div>
      </Panel>
      <Panel title="Ordering">
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Checkbox label="Accept delivery orders" checked={f.accepts_delivery} onChange={(e) => setF({ ...f, accepts_delivery: e.target.checked })} />
          <Checkbox label="Accept pickup orders" checked={f.accepts_pickup} onChange={(e) => setF({ ...f, accepts_pickup: e.target.checked })} />
          <Field label="Minimum order" htmlFor="rp-min" error={errors.min_order_cents}><Input id="rp-min" inputMode="decimal" value={f.min_order} onChange={set("min_order")} /></Field>
          <Field label="Typical prep time (minutes)" htmlFor="rp-prep" error={errors.prep_time_minutes}><Input id="rp-prep" type="number" min={5} max={180} value={f.prep_time_minutes} onChange={set("prep_time_minutes")} /></Field>
        </div>
      </Panel>
      <Panel title="Social">
        <div className="grid gap-4 p-5">
          <Field label="Instagram URL" htmlFor="rp-ig" error={errors.social_instagram}><Input id="rp-ig" value={f.social_instagram} onChange={set("social_instagram")} placeholder="https://instagram.com/…" /></Field>
          <Field label="Facebook URL" htmlFor="rp-fb" error={errors.social_facebook}><Input id="rp-fb" value={f.social_facebook} onChange={set("social_facebook")} /></Field>
          <Field label="TikTok URL" htmlFor="rp-tt" error={errors.social_tiktok}><Input id="rp-tt" value={f.social_tiktok} onChange={set("social_tiktok")} /></Field>
        </div>
      </Panel>
      <div className="xl:col-span-2">
        <Button type="submit" size="lg" loading={busy}>Save profile</Button>
      </div>
    </form>
  );
}
