"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard, Receipt, Store, Users, UtensilsCrossed, Percent, MapPinned, BadgePercent, Wallet, BarChart3, UserCog, Settings, Bike,
  Clock, Star, Building2, Menu, X, ExternalLink, Mail, Megaphone,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { LogoMark } from "@/components/site/logo";
import { LogoutButton } from "@/components/account/logout-button";

const ICONS = { LayoutDashboard, Receipt, Store, Users, UtensilsCrossed, Percent, MapPinned, BadgePercent, Wallet, BarChart3, UserCog, Settings, Bike, Clock, Star, Building2, Mail, Megaphone };
export type IconName = keyof typeof ICONS;
export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  exact?: boolean;
  badge?: number;
}

export function DashboardShell({ title, subtitle, nav, children, switcher, banner }: { title: string; subtitle?: string; nav: NavItem[]; children: ReactNode; switcher?: ReactNode; banner?: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <LogoMark className="size-9" />
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-semibold italic leading-tight text-cream-50">{title}</p>
          {subtitle && <p className="truncate text-xs text-cream-200/60">{subtitle}</p>}
        </div>
      </div>
      {switcher && <div className="px-4 pb-3">{switcher}</div>}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4" aria-label="Dashboard">
        {nav.map((n) => {
          const Icon = ICONS[n.icon];
          const active = n.exact ? pathname === n.href : pathname === n.href || pathname.startsWith(n.href + "/");
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition", active ? "bg-cream-50/10 text-cream-50" : "text-cream-200/70 hover:bg-cream-50/5 hover:text-cream-50")}
            >
              <Icon className={cn("size-4", active && "text-gold-400")} />
              <span className="flex-1">{n.label}</span>
              {n.badge ? <span className="rounded-full bg-ember-500 px-2 py-0.5 text-[0.65rem] font-bold text-white">{n.badge}</span> : null}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-cream-50/10 p-3">
        <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-cream-200/70 hover:bg-cream-50/5">
          <ExternalLink className="size-4" /> View website
        </Link>
        <LogoutButton light className="w-full justify-start px-3" />
      </div>
    </div>
  );
  return (
    <div className="min-h-dvh bg-cream-100 lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="grain sticky top-0 hidden h-dvh bg-night-900 lg:block">{sidebar}</aside>
      <div className="flex items-center justify-between border-b border-cream-200 bg-night-900 px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <LogoMark className="size-8" />
          <span className="font-display text-lg italic text-cream-50">{title}</span>
        </div>
        <button onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-full text-cream-50" aria-label="Open navigation">
          <Menu className="size-5" />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-night-950/60" onClick={() => setOpen(false)} />
          <aside className="grain absolute inset-y-0 left-0 w-72 animate-fade-in bg-night-900">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-4 grid size-9 place-items-center rounded-full text-cream-50" aria-label="Close navigation">
              <X className="size-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}
      <main className="min-w-0">
        {banner}
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-night-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
