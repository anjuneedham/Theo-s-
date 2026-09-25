import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";

export function Badge({ tone = "neutral", className, children }: { tone?: "neutral" | "ember" | "gold" | "leaf" | "dark" | "red"; className?: string; children: ReactNode }) {
  const tones = {
    neutral: "bg-cream-200 text-night-700",
    ember: "bg-ember-50 text-ember-700",
    gold: "bg-gold-300/40 text-gold-600",
    leaf: "bg-leaf-50 text-leaf-700",
    dark: "bg-night-900 text-cream-50",
    red: "bg-red-50 text-red-700",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}>{children}</span>;
}

export function Money({ cents, currency = "JMD", className }: { cents: number; currency?: string; className?: string }) {
  return <span className={cn("tabular-nums", className)}>{formatMoney(cents, currency)}</span>;
}

export function Field({ label, htmlFor, error, hint, children, className }: { label: string; htmlFor?: string; error?: string | null; hint?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-night-800">
        {label}
      </label>
      {children}
      {error ? <p className="text-sm font-medium text-ember-700" role="alert">{error}</p> : hint ? <p className="text-xs text-night-600/80">{hint}</p> : null}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn("field-input", className)} {...props} />;
}
export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn("field-input min-h-24", className)} {...props} />;
}
export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn("field-input appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%234a382e%22 stroke-width=%222.5%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[position:right_1rem_center] bg-no-repeat pr-10", className)} {...props}>
      {children}
    </select>
  );
}

export function Checkbox({ label, className, ...props }: ComponentProps<"input"> & { label: ReactNode }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3 text-sm text-night-800", className)}>
      <input type="checkbox" className="mt-0.5 size-5 shrink-0 rounded-md border-cream-300 accent-ember-500" {...props} />
      <span>{label}</span>
    </label>
  );
}

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-cream-300 bg-cream-50 px-6 py-12 text-center">
      {icon && <div className="mb-4 grid size-14 place-items-center rounded-full bg-cream-200 text-clay-500">{icon}</div>}
      <h3 className="text-xl text-night-900">{title}</h3>
      {children && <div className="mt-2 max-w-md text-sm text-night-600">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("inline-flex text-gold-500", className)} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 20 20" className={cn("size-4", i <= Math.round(rating) ? "fill-current" : "fill-cream-300")} aria-hidden>
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9z" />
        </svg>
      ))}
    </span>
  );
}

export function SectionHeading({ eyebrow, title, children, align = "left", light }: { eyebrow?: string; title: ReactNode; children?: ReactNode; align?: "left" | "center"; light?: boolean }) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow && <p className={cn("eyebrow", light && "text-gold-400")}>{eyebrow}</p>}
      <h2 className={cn("mt-3 text-3xl leading-tight sm:text-4xl lg:text-[2.75rem]", light ? "text-cream-50" : "text-night-900")}>{title}</h2>
      {children && <div className={cn("mt-4 text-base leading-relaxed sm:text-lg", light ? "text-cream-200/80" : "text-night-600")}>{children}</div>}
    </div>
  );
}

export function PageHero({ eyebrow, title, children, dark = true }: { eyebrow?: string; title: string; children?: ReactNode; dark?: boolean }) {
  return (
    <section className={cn("grain relative overflow-hidden", dark ? "bg-night-900 text-cream-50" : "bg-cream-200")}>
      {dark && <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-ember-500/25 blur-3xl" aria-hidden />}
      {dark && <div className="pointer-events-none absolute -bottom-32 left-10 size-80 rounded-full bg-gold-500/15 blur-3xl" aria-hidden />}
      <div className="container-page relative py-14 sm:py-20">
        {eyebrow && <p className={cn("eyebrow", dark && "text-gold-400")}>{eyebrow}</p>}
        <h1 className={cn("mt-3 max-w-3xl text-4xl leading-[1.05] sm:text-5xl lg:text-6xl", dark ? "text-cream-50" : "text-night-900")}>{title}</h1>
        {children && <div className={cn("mt-5 max-w-2xl text-lg leading-relaxed", dark ? "text-cream-200/85" : "text-night-600")}>{children}</div>}
      </div>
    </section>
  );
}
