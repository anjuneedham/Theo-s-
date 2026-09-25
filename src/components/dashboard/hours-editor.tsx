"use client";

import { useState } from "react";
import type { OperatingHours } from "@/lib/types";
import { DAY_NAMES } from "@/lib/hours";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";
import { api } from "@/lib/api-client";
import { toast } from "@/components/ui/toast";

export function HoursEditor({ restaurantId, initial }: { restaurantId: string; initial: OperatingHours[] }) {
  const [rows, setRows] = useState(() =>
    [1, 2, 3, 4, 5, 6, 0].map((d) => {
      const h = initial.find((x) => x.day_of_week === d);
      return { day_of_week: d, opens_at: h?.opens_at ?? "11:00", closes_at: h?.closes_at ?? "21:00", is_closed: h?.is_closed ?? false };
    }),
  );
  const [busy, setBusy] = useState(false);
  const update = (i: number, patch: Partial<(typeof rows)[number]>) => setRows(rows.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  return (
    <div className="card max-w-2xl p-5">
      <ul className="divide-y divide-cream-200">
        {rows.map((r, i) => (
          <li key={r.day_of_week} className="flex flex-wrap items-center gap-3 py-3">
            <span className="w-28 font-semibold">{DAY_NAMES[r.day_of_week]}</span>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!r.is_closed} onChange={(e) => update(i, { is_closed: !e.target.checked })} className="size-4 accent-ember-500" /> Open
            </label>
            {!r.is_closed && (
              <div className="flex items-center gap-2">
                <Input type="time" aria-label={`${DAY_NAMES[r.day_of_week]} opens`} value={r.opens_at} onChange={(e) => update(i, { opens_at: e.target.value })} className="w-32 py-2" />
                <span>–</span>
                <Input type="time" aria-label={`${DAY_NAMES[r.day_of_week]} closes`} value={r.closes_at} onChange={(e) => update(i, { closes_at: e.target.value })} className="w-32 py-2" />
                {r.closes_at <= r.opens_at && <span className="text-xs text-night-600">(next day)</span>}
              </div>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex gap-2">
        <Button
          loading={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await api(`/api/v1/partner/${restaurantId}/hours`, { method: "PUT", body: { hours: rows } });
              toast.success("Hours saved");
            } catch (e) {
              toast.error((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          Save hours
        </Button>
        <Button variant="secondary" onClick={() => setRows(rows.map((r) => ({ ...r, opens_at: rows[0].opens_at, closes_at: rows[0].closes_at })))}>Copy Monday to all</Button>
      </div>
    </div>
  );
}
