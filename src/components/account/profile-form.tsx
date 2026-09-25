"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Checkbox } from "@/components/ui/primitives";
import { api, ApiError } from "@/lib/api-client";
import { toast } from "@/components/ui/toast";

export function ProfileForm({ initial }: { initial: { full_name: string; phone: string; email: string; marketing_opt_in: boolean } }) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mt-4 space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await api("/api/v1/me/profile", { method: "PATCH", body: { full_name: form.full_name, phone: form.phone || null, marketing_opt_in: form.marketing_opt_in } });
          setErrors({});
          toast.success("Profile saved");
        } catch (err) {
          if (err instanceof ApiError) setErrors(err.fields ?? {});
          toast.error((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <Field label="Name" htmlFor="pf-name" error={errors.full_name}>
        <Input id="pf-name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
      </Field>
      <Field label="Phone" htmlFor="pf-phone" error={errors.phone}>
        <Input id="pf-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </Field>
      <Field label="Email" htmlFor="pf-email" hint="Contact support to change your sign-in email">
        <Input id="pf-email" value={form.email} disabled />
      </Field>
      <Checkbox label="Email me specials and event news" checked={form.marketing_opt_in} onChange={(e) => setForm({ ...form, marketing_opt_in: e.target.checked })} />
      <Button type="submit" loading={busy}>Save changes</Button>
    </form>
  );
}
