import { LogoMark } from "@/components/site/logo";

export const metadata = { title: "You're offline", robots: { index: false } };

export default function Offline() {
  return (
    <div className="grain grid min-h-dvh place-items-center bg-night-900 px-6 text-center text-cream-50">
      <div>
        <LogoMark className="mx-auto size-14" />
        <h1 className="mt-6 text-3xl">You&apos;re offline</h1>
        <p className="mt-2 text-cream-200/70">Check your connection and try again. Your cart is saved on this device.</p>
      </div>
    </div>
  );
}
