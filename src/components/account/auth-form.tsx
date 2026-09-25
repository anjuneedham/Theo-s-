"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Checkbox } from "@/components/ui/primitives";
import { api, ApiError } from "@/lib/api-client";

function safeNext(next: string | null, fallback: string) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

export function AuthForm({ mode, next, demoAccounts }: { mode: "login" | "signup"; next: string | null; demoAccounts?: { email: string; password: string; role: string }[] }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent, override?: { email: string; password: string }) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setMessage(null);
    try {
      if (mode === "login") {
        const { user } = await api<{ user: { role: string } }>("/api/v1/auth/login", { body: override ?? { email, password } });
        const home = user.role === "admin" ? "/admin" : user.role === "restaurant" ? "/partner" : user.role === "driver" ? "/driver" : "/account";
        window.location.href = safeNext(next, home);
      } else {
        const res = await api<{ needsEmailConfirmation: boolean }>("/api/v1/auth/signup", { body: { email, password, full_name: name, phone: phone || null, marketing_opt_in: optIn } });
        if (res.needsEmailConfirmation) {
          setMessage("Check your email to confirm your account, then sign in.");
          setBusy(false);
          return;
        }
        window.location.href = safeNext(next, "/account");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fields ?? {});
        setMessage(err.message);
      }
      setBusy(false);
    }
  }

  return (
    <div className="card mx-auto w-full max-w-md p-6 sm:p-8">
      <h1 className="text-3xl">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
      <p className="mt-1 text-sm text-night-600">
        {mode === "login" ? "Sign in to track orders, save addresses and reorder faster." : "Save addresses, track orders and reorder your favourites in one tap."}
      </p>
      {message && <p className="mt-4 rounded-xl bg-cream-200 px-4 py-3 text-sm font-medium text-night-800" role="alert">{message}</p>}
      <form onSubmit={(e) => submit(e)} className="mt-6 space-y-4" noValidate>
        {mode === "signup" && (
          <>
            <Field label="Full name" htmlFor="full_name" error={errors.full_name}>
              <Input id="full_name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label="Phone (optional)" htmlFor="phone" error={errors.phone}>
              <Input id="phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
          </>
        )}
        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password} hint={mode === "signup" ? "At least 8 characters" : undefined}>
          <Input id="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        {mode === "signup" && <Checkbox label="Send me specials and event news (you can unsubscribe any time)" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} />}
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          {mode === "login" ? "Sign in" : "Create account"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-night-600">
        {mode === "login" ? (
          <>New here? <Link href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-ember-600">Create an account</Link></>
        ) : (
          <>Already have an account? <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-ember-600">Sign in</Link></>
        )}
      </p>
      {demoAccounts && demoAccounts.length > 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-gold-400 bg-gold-300/15 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-gold-600">Demo mode (local data only)</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {demoAccounts.map((a) => (
              <button key={a.email} type="button" onClick={(e) => submit(e, a)} className="rounded-xl bg-white px-3 py-2 text-left text-xs font-semibold capitalize ring-1 ring-cream-300 hover:ring-gold-400">
                {a.role}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
