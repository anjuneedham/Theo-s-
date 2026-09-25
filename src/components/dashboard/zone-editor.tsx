"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { DeliveryZone } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea, Checkbox, EmptyState } from "@/components/ui/primitives";
import { Modal } from "@/components/ui/modal";
import { formatMoney, parseMoneyInput } from "@/lib/money";
import { api, ApiError } from "@/lib/api-client";
import { toast } from "@/components/ui/toast";

type Draft = { id?: string; name: string; description: string; fee: string; min_minutes: string; max_minutes: string; areas: string; radius_km: string; min_order: string; is_active: boolean };

export function ZoneEditor({ restaurantId, currency, zones, hasLocation }: { restaurantId: string; currency: string; zones: DeliveryZone[]; hasLocation: boolean }) {
  const router = useRouter();
  const [d, setD] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const base = `/api/v1/partner/${restaurantId}/zones`;

  async function save() {
    if (!d) return;
    setBusy(true);
    const body = {
      name: d.name,
      description: d.description || null,
      fee_cents: parseMoneyInput(d.fee || "0") ?? 0,
      min_minutes: Number(d.min_minutes),
      max_minutes: Number(d.max_minutes),
      areas: d.areas.split(/[,\n]/).map((a) => a.trim()).filter(Boolean),
      radius_km: d.radius_km ? Number(d.radius_km) : null,
      min_order_cents: parseMoneyInput(d.min_order || "0") ?? 0,
      is_active: d.is_active,
    };
    try {
      await api(d.id ? `${base}/${d.id}` : base, { method: d.id ? "PATCH" : "POST", body });
      toast.success("Zone saved");
      setD(null);
      router.refresh();
    } catch (e) {
      if (e instanceof ApiError) setErrors(e.fields ?? {});
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Button size="sm" onClick={() => { setErrors({}); setD({ name: `Zone ${String.fromCharCode(65 + zones.length)}`, description: "", fee: "", min_minutes: "30", max_minutes: "50", areas: "", radius_km: "", min_order: "0", is_active: true }); }}>
        <Plus className="size-4" /> Add zone
      </Button>
      {!hasLocation && <p className="mt-3 text-sm text-gold-600">Add your restaurant&apos;s coordinates in Profile to enable radius-based zones.</p>}
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {zones.length === 0 && <EmptyState title="No delivery zones">Add at least one zone to accept delivery orders.</EmptyState>}
        {zones.map((z) => (
          <div key={z.id} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold">{z.name} {!z.is_active && <span className="ml-1 rounded-full bg-cream-200 px-2 py-0.5 text-xs">Inactive</span>}</p>
                <p className="text-sm text-night-600">{formatMoney(z.fee_cents, currency)} · {z.min_minutes}–{z.max_minutes} min · min {formatMoney(z.min_order_cents, currency)}{z.radius_km ? ` · ${z.radius_km} km radius` : ""}</p>
              </div>
              <div className="flex">
                <button aria-label={`Edit ${z.name}`} className="grid size-8 place-items-center rounded-full hover:bg-cream-200" onClick={() => { setErrors({}); setD({ id: z.id, name: z.name, description: z.description ?? "", fee: (z.fee_cents / 100).toString(), min_minutes: String(z.min_minutes), max_minutes: String(z.max_minutes), areas: z.areas.join(", "), radius_km: z.radius_km?.toString() ?? "", min_order: (z.min_order_cents / 100).toString(), is_active: z.is_active }); }}><Pencil className="size-4" /></button>
                <button aria-label={`Delete ${z.name}`} className="grid size-8 place-items-center rounded-full hover:bg-cream-200" onClick={async () => { if (!confirm(`Delete ${z.name}?`)) return; try { await api(`${base}/${z.id}`, { method: "DELETE" }); router.refresh(); } catch (e) { toast.error((e as Error).message); } }}><Trash2 className="size-4" /></button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {z.areas.map((a) => <span key={a} className="rounded-full bg-cream-200 px-2.5 py-0.5 text-xs">{a}</span>)}
            </div>
          </div>
        ))}
      </div>
      <Modal open={Boolean(d)} onClose={() => setD(null)} title={d?.id ? "Edit zone" : "New zone"} footer={<Button className="w-full" loading={busy} onClick={save}>Save zone</Button>}>
        {d && (
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Name" htmlFor="z-name" error={errors.name}><Input id="z-name" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></Field>
            <Field label={`Delivery fee (${currency})`} htmlFor="z-fee" error={errors.fee_cents}><Input id="z-fee" inputMode="decimal" value={d.fee} onChange={(e) => setD({ ...d, fee: e.target.value })} /></Field>
            <Field label="Min minutes" htmlFor="z-min" error={errors.min_minutes}><Input id="z-min" type="number" value={d.min_minutes} onChange={(e) => setD({ ...d, min_minutes: e.target.value })} /></Field>
            <Field label="Max minutes" htmlFor="z-max" error={errors.max_minutes}><Input id="z-max" type="number" value={d.max_minutes} onChange={(e) => setD({ ...d, max_minutes: e.target.value })} /></Field>
            <Field label="Minimum order" htmlFor="z-mo"><Input id="z-mo" inputMode="decimal" value={d.min_order} onChange={(e) => setD({ ...d, min_order: e.target.value })} /></Field>
            <Field label="Radius (km, optional)" htmlFor="z-rad" error={errors.radius_km}><Input id="z-rad" inputMode="decimal" value={d.radius_km} onChange={(e) => setD({ ...d, radius_km: e.target.value })} /></Field>
            <Field label="Areas served (comma-separated)" htmlFor="z-areas" error={errors.areas} className="sm:col-span-2"><Textarea id="z-areas" value={d.areas} onChange={(e) => setD({ ...d, areas: e.target.value })} placeholder="New Kingston, Half Way Tree, Liguanea" /></Field>
            <Field label="Description" htmlFor="z-desc" className="sm:col-span-2"><Input id="z-desc" value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} /></Field>
            <Checkbox label="Active" checked={d.is_active} onChange={(e) => setD({ ...d, is_active: e.target.checked })} />
          </div>
        )}
      </Modal>
    </div>
  );
}
