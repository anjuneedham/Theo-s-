import type { Metadata } from "next";
import { AuthForm } from "@/components/account/auth-form";
import { config } from "@/lib/config";
import { DEMO_ACCOUNTS } from "@/lib/db/seed";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  // Demo shortcuts only exist with the local development backend.
  const demo = config.dataBackend === "local" ? DEMO_ACCOUNTS.map((a) => ({ email: a.email, password: a.password, role: a.role === "restaurant" ? (a.email.startsWith("owner") ? "Theo's staff" : "Partner") : a.role })) : undefined;
  return (
    <div className="container-page py-12 pb-28 sm:py-20">
      <AuthForm mode="login" next={next ?? null} demoAccounts={demo} />
    </div>
  );
}
