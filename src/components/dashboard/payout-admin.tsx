"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Payout } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";
import { Panel, DataTable, Td, StatCard } from "./widgets";
import { formatMoney } from "@/lib/money";
import { api } from "@/lib/api-client";
import { toast } from "@/components/ui/toast";

export function PayoutAdmin({ payouts, names, unsettledCount }: { payouts: Payout[]; names: Record<string, string>; unsettledCount: number }) {
  const router = useRouter();
  const [end, setEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const pending = payouts.filter((p) => p.status !== "paid");
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard tone="dark" label="Unsettled orders" value={unsettledCount} sub="Completed orders not yet in a payout" />
        <StatCard label="Owed to restaurants" value={formatMoney(pending.filter((p) => p.amount_cents > 0).reduce((s, p) => s + p.amount_cents, 0))} sub={`${pending.length} open payouts`} />
        <StatCard label="Due from restaurants" value={formatMoney(-pending.filter((p) => p.amount_cents < 0).reduce((s, p) => s + p.amount_cents, 0))} sub="From cash collected on pickup" />
      </div>
      <Panel title="Run settlement">
        <div className="flex flex-wrap items-end gap-3 p-5">
          <label className="text-sm font-semibold">Include orders placed before
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1.5 w-48" />
          </label>
          <Button
            loading={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const res = await api<{ payouts: Payout[] }>("/api/v1/admin/payouts", { body: { period_end: new Date(`${end}T23:59:59-05:00`).toISOString() } });
                toast.success(res.payouts.length ? `Created ${res.payouts.length} payout(s)` : "Nothing to settle");
                router.refresh();
              } catch (e) {
                toast.error((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Generate payouts
          </Button>
          <p className="w-full text-xs text-night-600">Payouts are recorded here; money is moved via your bank. Automating transfers requires a payouts-capable provider.</p>
        </div>
      </Panel>
      <Panel title="Payouts">
        <DataTable head={["Restaurant", "Period", "Orders", "Sales", "Commission", "Net", "Status", ""]}>
          {payouts.map((p) => (
            <tr key={p.id}>
              <Td className="font-semibold">{names[p.restaurant_id]}</Td>
              <Td>{new Date(p.period_start).toLocaleDateString()} – {new Date(p.period_end).toLocaleDateString()}</Td>
              <Td>{p.order_count}</Td>
              <Td>{formatMoney(p.gross_sales_cents, p.currency)}</Td>
              <Td>{formatMoney(p.commission_cents, p.currency)}</Td>
              <Td className="font-bold">{p.amount_cents < 0 ? `Due ${formatMoney(-p.amount_cents, p.currency)}` : formatMoney(p.amount_cents, p.currency)}</Td>
              <Td><span className="capitalize">{p.status}</span>{p.reference && <span className="block text-xs text-night-600">{p.reference}</span>}</Td>
              <Td>
                {p.status !== "paid" && (
                  <Button size="sm" variant="secondary" onClick={async () => {
                    const reference = prompt("Bank transfer / receipt reference:");
                    if (reference === null) return;
                    try {
                      await api(`/api/v1/admin/payouts/${p.id}`, { method: "PATCH", body: { status: "paid", reference: reference || null } });
                      toast.success("Marked as settled");
                      router.refresh();
                    } catch (e) {
                      toast.error((e as Error).message);
                    }
                  }}>Mark settled</Button>
                )}
              </Td>
            </tr>
          ))}
        </DataTable>
        {payouts.length === 0 && <p className="p-5 text-sm text-night-600">No payouts yet.</p>}
      </Panel>
    </div>
  );
}
