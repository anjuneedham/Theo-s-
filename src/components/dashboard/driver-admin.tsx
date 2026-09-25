"use client";

import { useRouter } from "next/navigation";
import type { Delivery, Driver, OrderStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/primitives";
import { StatusPill } from "@/components/ui/status-pill";
import { Panel, DataTable, Td } from "./widgets";
import { formatMoney } from "@/lib/money";
import { api } from "@/lib/api-client";
import { toast } from "@/components/ui/toast";

export function DriverAdmin({ drivers, deliveries }: { drivers: (Driver & { region: string | null; completedToday: number })[]; deliveries: { delivery: Delivery; order_number: string; order_status: OrderStatus; area: string; restaurant: string }[] }) {
  const router = useRouter();
  const run = async (fn: () => Promise<unknown>, msg: string) => {
    try {
      await fn();
      toast.success(msg);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  const approved = drivers.filter((d) => d.is_approved);
  return (
    <div className="space-y-6">
      <Panel title={`Active deliveries (${deliveries.length})`}>
        <DataTable head={["Order", "Restaurant → area", "Order status", "Driver", "Driver pay"]}>
          {deliveries.map(({ delivery: d, order_number, order_status, area, restaurant }) => (
            <tr key={d.id}>
              <Td className="font-semibold">{order_number}</Td>
              <Td>{restaurant} → {area}</Td>
              <Td><StatusPill status={order_status} fulfillment="delivery" /></Td>
              <Td>
                <Select
                  aria-label={`Driver for ${order_number}`}
                  value={d.driver_id ?? ""}
                  disabled={d.status === "picked_up"}
                  onChange={(e) => run(() => api(`/api/v1/admin/deliveries/${d.id}`, { method: "PATCH", body: { driver_id: e.target.value || null } }), "Driver assignment updated")}
                  className="min-w-44 py-2 text-sm"
                >
                  <option value="">Unassigned</option>
                  {approved.map((dr) => <option key={dr.id} value={dr.id}>{dr.full_name} ({dr.status})</option>)}
                </Select>
              </Td>
              <Td>{formatMoney(d.driver_payout_cents + d.tip_cents)}</Td>
            </tr>
          ))}
        </DataTable>
        {deliveries.length === 0 && <p className="p-5 text-sm text-night-600">No active deliveries.</p>}
      </Panel>
      <Panel title="Drivers">
        <DataTable head={["Driver", "Vehicle", "Region", "Status", "Today", ""]}>
          {drivers.map((d) => (
            <tr key={d.id}>
              <Td><p className="font-semibold">{d.full_name}</p><p className="text-xs text-night-600">{d.phone}</p></Td>
              <Td>{d.vehicle_type}{d.vehicle_plate && ` · ${d.vehicle_plate}`}</Td>
              <Td>{d.region ?? "—"}</Td>
              <Td>{d.is_approved ? <span className="capitalize">{d.status}</span> : <span className="font-semibold text-gold-600">Awaiting approval</span>}</Td>
              <Td>{d.completedToday} delivered</Td>
              <Td>
                {d.is_approved ? (
                  <Button size="sm" variant="ghost" onClick={() => confirm(`Deactivate ${d.full_name}?`) && run(() => api(`/api/v1/admin/drivers/${d.id}`, { method: "PATCH", body: { approved: false } }), "Driver deactivated")}>Deactivate</Button>
                ) : (
                  <Button size="sm" onClick={() => run(() => api(`/api/v1/admin/drivers/${d.id}`, { method: "PATCH", body: { approved: true } }), "Driver approved")}>Approve</Button>
                )}
              </Td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}
