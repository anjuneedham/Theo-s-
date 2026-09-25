import Link from "next/link";
import { LogoMark } from "@/components/site/logo";

export default function NotFound() {
  return (
    <div className="grain grid min-h-dvh place-items-center bg-night-900 px-4 text-center text-cream-50">
      <div>
        <LogoMark className="mx-auto size-14" />
        <p className="eyebrow mt-6 text-gold-400">404</p>
        <h1 className="mt-2 text-4xl">This page went out for delivery</h1>
        <p className="mt-3 text-cream-200/70">We couldn&apos;t find what you were looking for.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="rounded-full bg-ember-500 px-6 py-3 font-semibold">Home</Link>
          <Link href="/menu" className="rounded-full border border-cream-50/30 px-6 py-3 font-semibold">View menu</Link>
        </div>
      </div>
    </div>
  );
}
