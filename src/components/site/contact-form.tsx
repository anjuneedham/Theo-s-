"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/primitives";
import { api, ApiError } from "@/lib/api-client";

const TOPICS = [
  ["general", "General question"],
  ["order", "About an order"],
  ["events", "Events & private hire"],
  ["catering", "Catering"],
  ["partnership", "Restaurant partnership"],
  ["careers", "Careers"],
] as const;

export function ContactForm({ initialTopic }: { initialTopic?: string }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", topic: TOPICS.some(([t]) => t === initialTopic) ? initialTopic! : "general", message: "", website: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  if (sent)
    return (
      <div className="mt-6 flex flex-col items-center rounded-2xl bg-leaf-50 p-8 text-center text-leaf-700">
        <CheckCircle2 className="size-10" />
        <p className="mt-3 text-lg font-bold">Message sent — thank you!</p>
        <p className="text-sm">We&apos;ll get back to you as soon as we can.</p>
      </div>
    );
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });
  return (
    <form
      className="mt-6 grid gap-4 sm:grid-cols-2"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await api("/api/v1/contact", { body: { ...form, phone: form.phone || null } });
          setSent(true);
        } catch (err) {
          if (err instanceof ApiError) setErrors(err.fields ?? { message: err.message });
        } finally {
          setBusy(false);
        }
      }}
    >
      <Field label="Name" htmlFor="c-name" error={errors.name}><Input id="c-name" autoComplete="name" value={form.name} onChange={set("name")} /></Field>
      <Field label="Email" htmlFor="c-email" error={errors.email}><Input id="c-email" type="email" autoComplete="email" value={form.email} onChange={set("email")} /></Field>
      <Field label="Phone (optional)" htmlFor="c-phone"><Input id="c-phone" type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} /></Field>
      <Field label="Topic" htmlFor="c-topic">
        <Select id="c-topic" value={form.topic} onChange={set("topic")}>
          {TOPICS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      </Field>
      <Field label="Message" htmlFor="c-msg" error={errors.message} className="sm:col-span-2"><Textarea id="c-msg" rows={5} value={form.message} onChange={set("message")} /></Field>
      <input type="text" name="website" value={form.website} onChange={set("website")} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden />
      <Button type="submit" loading={busy} className="sm:col-span-2 sm:justify-self-start">Send message</Button>
    </form>
  );
}
