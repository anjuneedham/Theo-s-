"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/primitives";
import { api, ApiError } from "@/lib/api-client";

export function DriverApplicationForm({ name, phone, regions }: { name: string; phone: string; regions: { id: string; name: string }[] }) {
  const [f, setF] = useState({ full_name: name, phone, vehicle_type: "Motorbike", vehicle_plate: "", region_id: regions[0]?.id ?? "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form
      className="grid gap-4"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await api("/api/v1/driver/apply", { body: { ...f, vehicle_plate: f.vehicle_plate || null, region_id: f.region_id || null } });
          window.location.reload();
        } catch (err) {
          if (err instanceof ApiError) setErrors(err.fields ?? { full_name: err.message });
          setBusy(false);
        }
      }}
    >
      <h2 className="text-2xl">Driver application</h2>
      <Field label="Full name" htmlFor="d-name" error={errors.full_name}><Input id="d-name" value={f.full_name} onChange={set("full_name")} /></Field>
      <Field label="Phone" htmlFor="d-phone" error={errors.phone}><Input id="d-phone" type="tel" value={f.phone} onChange={set("phone")} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Vehicle" htmlFor="d-veh"><Select id="d-veh" value={f.vehicle_type} onChange={set("vehicle_type")}>{["Motorbike", "Car", "Bicycle", "Van"].map((v) => <option key={v}>{v}</option>)}</Select></Field>
        <Field label="Plate number" htmlFor="d-plate"><Input id="d-plate" value={f.vehicle_plate} onChange={set("vehicle_plate")} /></Field>
      </div>
      <Field label="Area you'll deliver in" htmlFor="d-region"><Select id="d-region" value={f.region_id} onChange={set("region_id")}>{regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</Select></Field>
      <Button type="submit" loading={busy}>Submit application</Button>
    </form>
  );
}
