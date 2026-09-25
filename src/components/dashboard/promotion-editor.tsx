"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import type { Promotion } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Checkbox, EmptyState } from "@/components/ui/primitives";
import { Modal } from "@/components/ui/modal";
import { formatMoney, parseMoneyInput } from "@/lib/money";
import { api, ApiError } from "@/lib/api-client";
import { toast } from "@/components/ui/toast";
import { DataTable, Td } from "./widgets";

type Draft = { id?: string; code: string; title: string; description: string; type: Promotion["type"]; value: string; min_subtotal: string; starts_at: string; ends_at: string; usage_limit: string; is_active: boolean };

function describe(p: Promotion, currency: string) {
  if (p.type === "percent") return `${p.value / 100}% off food`;
  if (p.type === "fixed") return `${formatMoney(p.value, currency)} off`;
  return "Free delivery";
}
const toLocal = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

export function PromotionEditor({ apiBase, promotions, currency, fundedBy, restaurantNames }: { apiBase: string; promotions: Promotion[]; currency: string; fundedBy: string; restaurantNames?: Record<string, string> }) {
  const router = useRouter();
  const [d, setD] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!d) return;
    setBusy(true);
    const value = d.type === "percent" ? Math.round(Number(d.value) * 100) : d.type === "fixed" ? parseMoneyInput(d.value || "0") ?? 0 : 0;
    const body = {
      code: d.code || null,
      title: d.title,
      description: d.description || null,
      type: d.type,
      value,
      min_subtotal_cents: parseMoneyInput(d.min_subtotal || "0") ?? 0,
      starts_at: d.starts_at ? new Date(d.starts_at).toISOString() : null,
      ends_at: d.ends_at ? new Date(d.ends_at).toISOString() : null,
      usage_limit: d.usage_limit ? Number(d.usage_limit) : null,
      is_active: d.is_active,
    };
    try {
      await api(d.id ? `${apiBase}/${d.id}` : apiBase, { method: d.id ? "PATCH" : "POST", body });
      toast.success("Promotion saved");
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-night-600">Discounts created here are funded by the {fundedBy}.</p>
        <Button size="sm" onClick={() => { setErrors({}); setD({ code: "", title: "", description: "", type: "percent", value: "10", min_subtotal: "0", starts_at: "", ends_at: "", usage_limit: "", is_active: true }); }}>
          <Plus className="size-4" /> New promotion
        </Button>
      </div>
      <div className="card mt-4 overflow-hidden">
        {promotions.length === 0 ? <div className="p-5"><EmptyState title="No promotions yet">Create a code like WELCOME10 to reward direct orders.</EmptyState></div> : (
          <DataTable head={["Promotion", "Code", "Offer", "Used", "Status", ""]}>
            {promotions.map((p) => (
              <tr key={p.id}>
                <Td><p className="font-semibold">{p.title}</p>{restaurantNames && <p className="text-xs text-night-600">{p.restaurant_id ? restaurantNames[p.restaurant_id] : "Platform-wide"}</p>}</Td>
                <Td><span className="font-mono text-xs font-bold">{p.code ?? "—"}</span></Td>
                <Td>{describe(p, currency)}{p.min_subtotal_cents > 0 && <span className="block text-xs text-night-600">min {formatMoney(p.min_subtotal_cents, currency)}</span>}</Td>
                <Td>{p.used_count}{p.usage_limit ? ` / ${p.usage_limit}` : ""}</Td>
                <Td>{p.is_active ? <span className="font-semibold text-leaf-700">Active</span> : <span className="text-night-600">Paused</span>}</Td>
                <Td>
                  {(!restaurantNames || p.restaurant_id === null) && (
                    <button aria-label={`Edit ${p.title}`} className="grid size-8 place-items-center rounded-full hover:bg-cream-200" onClick={() => { setErrors({}); setD({ id: p.id, code: p.code ?? "", title: p.title, description: p.description ?? "", type: p.type, value: p.type === "percent" ? String(p.value / 100) : String(p.value / 100), min_subtotal: String(p.min_subtotal_cents / 100), starts_at: toLocal(p.starts_at), ends_at: toLocal(p.ends_at), usage_limit: p.usage_limit?.toString() ?? "", is_active: p.is_active }); }}>
                      <Pencil className="size-4" />
                    </button>
                  )}
                </Td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
      <Modal open={Boolean(d)} onClose={() => setD(null)} title={d?.id ? "Edit promotion" : "New promotion"} footer={<Button className="w-full" loading={busy} onClick={save}>Save promotion</Button>}>
        {d && (
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Title" htmlFor="pr-title" error={errors.title} className="sm:col-span-2"><Input id="pr-title" value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} placeholder="10% off your first order" /></Field>
            <Field label="Code (optional)" htmlFor="pr-code" error={errors.code} hint="Leave empty for an automatic offer shown on the site"><Input id="pr-code" value={d.code} onChange={(e) => setD({ ...d, code: e.target.value.toUpperCase() })} /></Field>
            <Field label="Type" htmlFor="pr-type">
              <Select id="pr-type" value={d.type} onChange={(e) => setD({ ...d, type: e.target.value as Promotion["type"] })}>
                <option value="percent">Percent off food</option>
                <option value="fixed">Fixed amount off</option>
                <option value="free_delivery">Free delivery</option>
              </Select>
            </Field>
            {d.type !== "free_delivery" && <Field label={d.type === "percent" ? "Percent" : `Amount (${currency})`} htmlFor="pr-value" error={errors.value}><Input id="pr-value" inputMode="decimal" value={d.value} onChange={(e) => setD({ ...d, value: e.target.value })} /></Field>}
            <Field label="Minimum order" htmlFor="pr-min"><Input id="pr-min" inputMode="decimal" value={d.min_subtotal} onChange={(e) => setD({ ...d, min_subtotal: e.target.value })} /></Field>
            <Field label="Starts" htmlFor="pr-start"><Input id="pr-start" type="datetime-local" value={d.starts_at} onChange={(e) => setD({ ...d, starts_at: e.target.value })} /></Field>
            <Field label="Ends" htmlFor="pr-end"><Input id="pr-end" type="datetime-local" value={d.ends_at} onChange={(e) => setD({ ...d, ends_at: e.target.value })} /></Field>
            <Field label="Usage limit" htmlFor="pr-limit"><Input id="pr-limit" type="number" value={d.usage_limit} onChange={(e) => setD({ ...d, usage_limit: e.target.value })} /></Field>
            <Field label="Description" htmlFor="pr-desc" className="sm:col-span-2"><Input id="pr-desc" value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} /></Field>
            <Checkbox label="Active" checked={d.is_active} onChange={(e) => setD({ ...d, is_active: e.target.checked })} />
          </div>
        )}
      </Modal>
    </div>
  );
}
