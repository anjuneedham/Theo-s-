"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Settings2, ExternalLink, Megaphone } from "lucide-react";
import type { Placement, Restaurant } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Checkbox } from "@/components/ui/primitives";
import { Modal } from "@/components/ui/modal";
import { DataTable, Td, Panel } from "./widgets";
import { formatMoney, bpsToPercent, parseMoneyInput } from "@/lib/money";
import { api } from "@/lib/api-client";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

interface Row {
  restaurant: Restaurant;
  owner: { name: string; email: string } | null;
  orders30: number;
  gross30: number;
  commission30: number;
}

const STATUS_TONE: Record<string, string> = { active: "bg-leaf-50 text-leaf-700", pending: "bg-gold-300/40 text-gold-600", suspended: "bg-ember-50 text-ember-700", rejected: "bg-cream-200 text-night-600" };

export function RestaurantAdmin({ rows, plans, regions, defaultCommissionBps, placements, filter }: { rows: Row[]; plans: { id: string; name: string; commission_rate_bps: number }[]; regions: { id: string; name: string }[]; defaultCommissionBps: number; placements: Placement[]; filter: string }) {
  const router = useRouter();
  const [edit, setEdit] = useState<null | { r: Restaurant; commission: string; plan_id: string; region_id: string; is_featured: boolean }>(null);
  const [placement, setPlacement] = useState<null | { restaurant_id: string; type: "featured" | "sponsored"; starts_at: string; ends_at: string; fee: string }>(null);
  const [busy, setBusy] = useState(false);

  async function patch(id: string, body: object, msg: string) {
    try {
      await api(`/api/v1/admin/restaurants/${id}`, { method: "PATCH", body });
      toast.success(msg);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  const effective = (r: Restaurant) => r.commission_rate_bps ?? plans.find((p) => p.id === r.plan_id)?.commission_rate_bps ?? defaultCommissionBps;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1.5">
        {["all", "pending", "active", "suspended", "rejected"].map((s) => (
          <Link key={s} href={s === "all" ? "/admin/restaurants" : `/admin/restaurants?status=${s}`} className={cn("rounded-full px-3.5 py-1.5 text-sm font-semibold capitalize", filter === s ? "bg-night-900 text-cream-50" : "bg-white ring-1 ring-cream-300")}>{s}</Link>
        ))}
      </div>
      <Panel>
        <DataTable head={["Restaurant", "Status", "Plan / commission", "30d orders", "30d gross", "30d commission", ""]}>
          {rows.map(({ restaurant: r, owner, orders30, gross30, commission30 }) => (
            <tr key={r.id}>
              <Td>
                <p className="font-semibold">{r.name} {r.is_anchor && <span className="ml-1 rounded-full bg-night-900 px-2 py-0.5 text-[0.65rem] text-gold-400">Anchor</span>}{r.is_featured && <span className="ml-1 rounded-full bg-gold-300/40 px-2 py-0.5 text-[0.65rem] text-gold-600">Featured</span>}</p>
                <p className="text-xs text-night-600">{r.city}{owner && ` · ${owner.name} (${owner.email})`}</p>
              </Td>
              <Td><span className={cn("rounded-full px-2.5 py-1 text-xs font-bold capitalize", STATUS_TONE[r.status])}>{r.status}</span></Td>
              <Td>{plans.find((p) => p.id === r.plan_id)?.name ?? "No plan"} · <strong>{bpsToPercent(effective(r))}</strong>{r.commission_rate_bps !== null && <span className="text-xs text-night-600"> (override)</span>}</Td>
              <Td>{orders30}</Td>
              <Td>{formatMoney(gross30, r.currency)}</Td>
              <Td>{formatMoney(commission30, r.currency)}</Td>
              <Td>
                <div className="flex flex-wrap justify-end gap-1.5">
                  {r.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => patch(r.id, { status: "active" }, `${r.name} approved`)}>Approve</Button>
                      <Button size="sm" variant="danger" onClick={() => confirm(`Reject ${r.name}?`) && patch(r.id, { status: "rejected" }, "Application rejected")}>Reject</Button>
                    </>
                  )}
                  {r.status === "active" && !r.is_anchor && <Button size="sm" variant="ghost" onClick={() => confirm(`Suspend ${r.name}? It will disappear from the marketplace.`) && patch(r.id, { status: "suspended" }, "Suspended")}>Suspend</Button>}
                  {(r.status === "suspended" || r.status === "rejected") && <Button size="sm" variant="secondary" onClick={() => patch(r.id, { status: "active" }, "Reactivated")}>Activate</Button>}
                  <button aria-label={`Settings for ${r.name}`} className="grid size-8 place-items-center rounded-full hover:bg-cream-200" onClick={() => setEdit({ r, commission: r.commission_rate_bps === null ? "" : String(r.commission_rate_bps / 100), plan_id: r.plan_id ?? "", region_id: r.region_id ?? "", is_featured: r.is_featured })}><Settings2 className="size-4" /></button>
                  <Link aria-label={`Manage ${r.name}`} href={`/partner/${r.id}`} className="grid size-8 place-items-center rounded-full hover:bg-cream-200"><ExternalLink className="size-4" /></Link>
                </div>
              </Td>
            </tr>
          ))}
        </DataTable>
      </Panel>

      <Panel title="Paid placements" action={<Button size="sm" variant="secondary" onClick={() => setPlacement({ restaurant_id: rows[0]?.restaurant.id ?? "", type: "sponsored", starts_at: "", ends_at: "", fee: "" })}><Megaphone className="size-4" /> New placement</Button>}>
        {placements.length === 0 ? <p className="p-5 text-sm text-night-600">No featured or sponsored placements yet. Placements are a platform revenue stream and push a restaurant to the top of the marketplace.</p> : (
          <DataTable head={["Restaurant", "Type", "Dates", "Fee", "Status"]}>
            {placements.map((p) => (
              <tr key={p.id}><Td>{rows.find((r) => r.restaurant.id === p.restaurant_id)?.restaurant.name}</Td><Td className="capitalize">{p.type}</Td><Td>{new Date(p.starts_at).toLocaleDateString()} – {new Date(p.ends_at).toLocaleDateString()}</Td><Td>{formatMoney(p.fee_cents)}</Td><Td className="capitalize">{p.status}</Td></tr>
            ))}
          </DataTable>
        )}
      </Panel>

      <Modal open={Boolean(edit)} onClose={() => setEdit(null)} title={edit ? `Settings · ${edit.r.name}` : ""} footer={
        <Button className="w-full" loading={busy} onClick={async () => {
          if (!edit) return;
          setBusy(true);
          await patch(edit.r.id, { commission_rate_bps: edit.commission === "" ? null : Math.round(Number(edit.commission) * 100), plan_id: edit.plan_id || null, region_id: edit.region_id || null, is_featured: edit.is_featured }, "Saved");
          setBusy(false);
          setEdit(null);
        }}>Save</Button>
      }>
        {edit && (
          <div className="grid gap-4 p-5">
            <Field label="Subscription plan" htmlFor="ra-plan">
              <Select id="ra-plan" value={edit.plan_id} onChange={(e) => setEdit({ ...edit, plan_id: e.target.value })}>
                <option value="">No plan (platform default {bpsToPercent(defaultCommissionBps)})</option>
                {plans.map((p) => <option key={p.id} value={p.id}>{p.name} — {bpsToPercent(p.commission_rate_bps)}</option>)}
              </Select>
            </Field>
            <Field label="Commission override (%)" htmlFor="ra-comm" hint="Leave empty to use the plan rate. Applies to new orders only.">
              <Input id="ra-comm" inputMode="decimal" value={edit.commission} onChange={(e) => setEdit({ ...edit, commission: e.target.value })} />
            </Field>
            <Field label="Region" htmlFor="ra-region">
              <Select id="ra-region" value={edit.region_id} onChange={(e) => setEdit({ ...edit, region_id: e.target.value })}>
                <option value="">None</option>
                {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </Select>
            </Field>
            <Checkbox label="Featured on the marketplace" checked={edit.is_featured} onChange={(e) => setEdit({ ...edit, is_featured: e.target.checked })} />
          </div>
        )}
      </Modal>

      <Modal open={Boolean(placement)} onClose={() => setPlacement(null)} title="New paid placement" footer={
        <Button className="w-full" loading={busy} onClick={async () => {
          if (!placement) return;
          setBusy(true);
          try {
            await api("/api/v1/admin/placements", { body: { restaurant_id: placement.restaurant_id, type: placement.type, starts_at: new Date(placement.starts_at).toISOString(), ends_at: new Date(placement.ends_at).toISOString(), fee_cents: parseMoneyInput(placement.fee || "0") ?? 0 } });
            toast.success("Placement created");
            setPlacement(null);
            router.refresh();
          } catch (e) {
            toast.error((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}>Create placement</Button>
      }>
        {placement && (
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Restaurant" htmlFor="pl-r" className="sm:col-span-2">
              <Select id="pl-r" value={placement.restaurant_id} onChange={(e) => setPlacement({ ...placement, restaurant_id: e.target.value })}>
                {rows.filter((r) => r.restaurant.status === "active").map((r) => <option key={r.restaurant.id} value={r.restaurant.id}>{r.restaurant.name}</option>)}
              </Select>
            </Field>
            <Field label="Type" htmlFor="pl-t"><Select id="pl-t" value={placement.type} onChange={(e) => setPlacement({ ...placement, type: e.target.value as "featured" | "sponsored" })}><option value="sponsored">Sponsored (top of list)</option><option value="featured">Featured badge</option></Select></Field>
            <Field label="Fee (JMD)" htmlFor="pl-fee"><Input id="pl-fee" inputMode="decimal" value={placement.fee} onChange={(e) => setPlacement({ ...placement, fee: e.target.value })} /></Field>
            <Field label="Starts" htmlFor="pl-s"><Input id="pl-s" type="datetime-local" value={placement.starts_at} onChange={(e) => setPlacement({ ...placement, starts_at: e.target.value })} /></Field>
            <Field label="Ends" htmlFor="pl-e"><Input id="pl-e" type="datetime-local" value={placement.ends_at} onChange={(e) => setPlacement({ ...placement, ends_at: e.target.value })} /></Field>
          </div>
        )}
      </Modal>
    </div>
  );
}
