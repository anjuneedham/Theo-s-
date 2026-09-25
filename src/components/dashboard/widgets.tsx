import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";

export function StatCard({ label, value, sub, tone = "default", hint }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "default" | "dark" | "ember" | "leaf"; hint?: string }) {
  const tones = {
    default: "card",
    dark: "rounded-[var(--radius-card)] bg-night-900 text-cream-50",
    ember: "rounded-[var(--radius-card)] bg-ember-500 text-white",
    leaf: "rounded-[var(--radius-card)] bg-leaf-600 text-white",
  };
  return (
    <div className={cn(tones[tone], "p-5")} title={hint}>
      <p className={cn("text-xs font-bold uppercase tracking-wider", tone === "default" ? "text-night-600" : "opacity-75")}>{label}</p>
      <p className="mt-2 font-display text-3xl tabular-nums leading-none">{value}</p>
      {sub && <p className={cn("mt-2 text-xs", tone === "default" ? "text-night-600" : "opacity-80")}>{sub}</p>}
    </div>
  );
}

export function Panel({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("card overflow-hidden", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-cream-200 px-5 py-4">
          {title && <h2 className="font-sans text-base font-bold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** Accessible bar chart (SVG) with a data table fallback for screen readers. */
export function BarChart({ data, currency = "JMD", metric = "revenue" }: { data: { date: string; orders: number; revenue: number }[]; currency?: string; metric?: "revenue" | "orders" }) {
  const values = data.map((d) => (metric === "revenue" ? d.revenue : d.orders));
  const max = Math.max(1, ...values);
  const fmt = (v: number) => (metric === "revenue" ? formatMoney(v, currency) : String(v));
  return (
    <figure className="p-5">
      <div className="flex h-44 items-end gap-1.5" aria-hidden>
        {data.map((d, i) => (
          <div key={d.date} className="group relative flex h-full flex-1 flex-col justify-end">
            <div className="rounded-t-md bg-ember-500/85 transition group-hover:bg-ember-600" style={{ height: `${Math.max(2, (values[i] / max) * 100)}%` }} />
            <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-night-900 px-2 py-1 text-[0.65rem] font-semibold text-cream-50 group-hover:block">{fmt(values[i])}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5 text-[0.6rem] text-night-600" aria-hidden>
        {data.map((d, i) => (
          <span key={d.date} className="flex-1 text-center">{i % 2 === 0 ? new Date(d.date + "T12:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short" }) : ""}</span>
        ))}
      </div>
      <table className="sr-only">
        <caption>{metric === "revenue" ? "Revenue" : "Orders"} per day</caption>
        <tbody>{data.map((d, i) => <tr key={d.date}><th>{d.date}</th><td>{fmt(values[i])}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}

export function DataTable({ head, children, empty }: { head: ReactNode[]; children: ReactNode; empty?: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-cream-50 text-xs uppercase tracking-wider text-night-600">
          <tr>{head.map((h, i) => <th key={i} className="whitespace-nowrap px-5 py-3 font-bold">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-cream-200">{children}</tbody>
      </table>
      {empty}
    </div>
  );
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn("px-5 py-3.5 align-top", className)}>{children}</td>;
}
