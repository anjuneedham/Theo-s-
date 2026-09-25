import Link from "next/link";
import { requirePageUser } from "@/lib/auth/guards";
import { driverBoard } from "@/lib/services/drivers";
import { DriverApp } from "@/components/dashboard/driver-app";
import { LogoMark } from "@/components/site/logo";
import { LogoutButton } from "@/components/account/logout-button";

export const metadata = { title: "Driver", robots: { index: false } };

export default async function DriverPage() {
  const user = await requirePageUser("/driver", ["driver", "admin"]);
  const board = await driverBoard(user);
  return (
    <div className="min-h-dvh bg-cream-100">
      <header className="grain sticky top-0 z-20 bg-night-900 text-cream-50">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2"><LogoMark className="size-8" /><span className="font-display text-lg italic">Theo&apos;s Driver</span></Link>
          <LogoutButton light />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 pb-16">
        {!board.driver ? (
          <div className="card p-6 text-center">
            <h1 className="text-2xl">No driver profile</h1>
            <p className="mt-2 text-night-600">Apply to drive with Theo&apos;s first.</p>
            <Link href="/drive" className="mt-4 inline-block rounded-full bg-ember-500 px-5 py-2.5 font-semibold text-white">Apply</Link>
          </div>
        ) : !board.driver.is_approved ? (
          <div className="card p-6 text-center">
            <h1 className="text-2xl">Awaiting approval</h1>
            <p className="mt-2 text-night-600">We&apos;ll notify you once your account is approved.</p>
          </div>
        ) : (
          <DriverApp board={JSON.parse(JSON.stringify(board))} />
        )}
      </main>
    </div>
  );
}
