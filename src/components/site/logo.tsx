import Link from "next/link";
import { cn } from "@/lib/cn";

/** Theo's wordmark: a rising-sun mark (warmth, late nights, island mornings) + serif wordmark. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("size-9", className)} aria-hidden>
      <circle cx="24" cy="24" r="23" fill="#1a1310" />
      <path d="M9 30 A15 15 0 0 1 39 30 Z" fill="#dc5a2e" />
      <path d="M14 30 A10 10 0 0 1 34 30 Z" fill="#e0b25f" />
      {[-60, -30, 0, 30, 60].map((a) => (
        <rect key={a} x="23" y="6" width="2" height="6" rx="1" fill="#e0b25f" transform={`rotate(${a} 24 30)`} />
      ))}
      <rect x="9" y="31.5" width="30" height="2" rx="1" fill="#f8f1e6" />
      <rect x="13" y="35.5" width="22" height="2" rx="1" fill="#f8f1e6" opacity="0.6" />
    </svg>
  );
}

export function Logo({ light, className, compact }: { light?: boolean; className?: string; compact?: boolean }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)} aria-label="Theo's Restaurant & Lounge — home">
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className={cn("font-display text-[1.6rem] font-semibold italic tracking-tight", light ? "text-cream-50" : "text-night-900")}>
          Theo&apos;s
        </span>
        {!compact && (
          <span className={cn("mt-0.5 text-[0.56rem] font-bold uppercase tracking-[0.3em]", light ? "text-gold-400" : "text-clay-500")}>
            Restaurant &amp; Lounge
          </span>
        )}
      </span>
    </Link>
  );
}
