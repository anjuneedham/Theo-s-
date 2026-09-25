"use client";

import { useState } from "react";
import { MapPin, Plus, Trash2, Star } from "lucide-react";
import type { DeliveryAddress } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, EmptyState } from "@/components/ui/primitives";
import { Modal } from "@/components/ui/modal";
import { api, ApiError } from "@/lib/api-client";
import { toast } from "@/components/ui/toast";

const blank = { label: "Home", line1: "", line2: "", area: "", city: "", parish: "", instructions: "" };

export function AddressManager({ initial, areas }: { initial: DeliveryAddress[]; areas: string[] }) {
  const [addresses, setAddresses] = useState(initial);
  const [editing, setEditing] = useState<null | { id?: string; form: typeof blank }>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await api<{ addresses: DeliveryAddress[] }>("/api/v1/me/addresses");
    setAddresses(res.addresses);
  }

  async function save() {
    if (!editing) return;
    setBusy(true);
    try {
      const body = { ...editing.form, line2: editing.form.line2 || null, city: editing.form.city || null, parish: editing.form.parish || null, instructions: editing.form.instructions || null };
      if (editing.id) await api(`/api/v1/me/addresses/${editing.id}`, { method: "PATCH", body });
      else await api("/api/v1/me/addresses", { body });
      await refresh();
      setEditing(null);
      toast.success("Address saved");
    } catch (e) {
      if (e instanceof ApiError) setErrors(e.fields ?? {});
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex justify-end">
        <Button onClick={() => { setErrors({}); setEditing({ form: { ...blank, label: addresses.length ? "Work" : "Home" } }); }} size="sm">
          <Plus className="size-4" /> Add address
        </Button>
      </div>
      {addresses.length === 0 ? (
        <div className="mt-4"><EmptyState icon={<MapPin className="size-6" />} title="No saved addresses">Save an address to check out faster.</EmptyState></div>
      ) : (
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 font-bold">{a.label} {a.is_default && <span className="rounded-full bg-leaf-50 px-2 py-0.5 text-xs text-leaf-700">Default</span>}</p>
                  <p className="mt-1 text-sm text-night-600">{[a.line1, a.line2, a.area, a.city].filter(Boolean).join(", ")}</p>
                  {a.instructions && <p className="mt-1 text-xs italic text-night-600">{a.instructions}</p>}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => { setErrors({}); setEditing({ id: a.id, form: { label: a.label, line1: a.line1, line2: a.line2 ?? "", area: a.area, city: a.city ?? "", parish: a.parish ?? "", instructions: a.instructions ?? "" } }); }}>Edit</Button>
                {!a.is_default && (
                  <Button size="sm" variant="ghost" onClick={async () => { await api(`/api/v1/me/addresses/${a.id}`, { method: "PATCH", body: { is_default: true } }); await refresh(); }}>
                    <Star className="size-4" /> Make default
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={async () => { if (!confirm("Delete this address?")) return; await api(`/api/v1/me/addresses/${a.id}`, { method: "DELETE" }); await refresh(); }} aria-label={`Delete ${a.label}`}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? "Edit address" : "New address"} footer={<Button className="w-full" loading={busy} onClick={save}>Save address</Button>}>
        {editing && (
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Label" htmlFor="a-label" error={errors.label}>
              <Input id="a-label" value={editing.form.label} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, label: e.target.value } })} />
            </Field>
            <Field label="Area" htmlFor="a-area" error={errors.area}>
              <Select id="a-area" value={editing.form.area} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, area: e.target.value } })}>
                <option value="">Choose…</option>
                {[...new Set([...areas, editing.form.area].filter(Boolean))].map((a) => <option key={a} value={a}>{a}</option>)}
              </Select>
            </Field>
            <Field label="Street address" htmlFor="a-line1" error={errors.line1} className="sm:col-span-2">
              <Input id="a-line1" value={editing.form.line1} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, line1: e.target.value } })} />
            </Field>
            <Field label="Apartment / complex" htmlFor="a-line2">
              <Input id="a-line2" value={editing.form.line2} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, line2: e.target.value } })} />
            </Field>
            <Field label="City" htmlFor="a-city">
              <Input id="a-city" value={editing.form.city} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, city: e.target.value } })} />
            </Field>
            <Field label="Directions for the driver" htmlFor="a-ins" className="sm:col-span-2">
              <Input id="a-ins" value={editing.form.instructions} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, instructions: e.target.value } })} />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  );
}
