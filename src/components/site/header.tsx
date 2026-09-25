"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Menu as MenuIcon, ShoppingBag, User, X, UtensilsCrossed, Home, Store, Receipt } from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "./logo";
import { useCartCount } from "@/components/cart/cart-store";
import { buttonClass } from "@/components/ui/button";

const NAV = [
  { href: "/menu", label: "Menu" },
  { href: "/order", label: "Order Online" },
  { href: "/delivery", label: "Delivery" },
  { href: "/lounge", label: "Lounge" },
  { href: "/events", label: "Events" },
  { href: "/specials", label: "Specials" },
  { href: "/restaurants", label: "Restaurants" },
];
const MORE = [
  { href: "/about", label: "About Theo's" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
  { href: "/network", label: "Theo's Delivery Network" },
  { href: "/partners", label: "Partner with us" },
  { href: "/drive", label: "Drive with us" },
];

export interface HeaderUser {
  name: string;
  role: string;
}

function useHydrated() {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}

export function SiteHeader({ user }: { user: HeaderUser | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const count = useCartCount();
  const hydrated = useHydrated();
  const isHome = pathname === "/";
  const dark = isHome && !scrolled && !open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const dashboardHref = user?.role === "admin" ? "/admin" : user?.role === "restaurant" ? "/partner" : user?.role === "driver" ? "/driver" : null;

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 transition-colors duration-300",
          dark ? "bg-night-900/0 text-cream-50" : "border-b border-cream-200/80 bg-cream-100/90 text-night-900 backdrop-blur-lg",
          isHome && !scrolled && !open && "absolute inset-x-0",
        )}
      >
        <div className="container-page flex h-16 items-center justify-between gap-4 lg:h-20">
          <Logo light={dark} />
          <nav className="hidden items-center gap-1 xl:flex" aria-label="Main">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm font-semibold transition",
                  pathname.startsWith(n.href) ? (dark ? "bg-cream-50/15" : "bg-night-900/5 text-ember-600") : dark ? "hover:bg-cream-50/10" : "hover:bg-night-900/5",
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1.5">
            <Link
              href={user ? dashboardHref ?? "/account" : "/login"}
              className={cn("hidden h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold sm:inline-flex", dark ? "hover:bg-cream-50/10" : "hover:bg-night-900/5")}
            >
              <User className="size-4" />
              {user ? (dashboardHref ? "Dashboard" : user.name.split(" ")[0]) : "Sign in"}
            </Link>
            <Link href="/cart" className={cn("relative grid size-10 place-items-center rounded-full", dark ? "hover:bg-cream-50/10" : "hover:bg-night-900/5")} aria-label={`Cart, ${hydrated ? count : 0} items`}>
              <ShoppingBag className="size-5" />
              {hydrated && count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-ember-500 px-1 text-[0.68rem] font-bold text-white">{count}</span>
              )}
            </Link>
            <span className="ml-1 hidden md:block">
              <Link href="/order" className={buttonClass("primary", "sm")}>
                Order now
              </Link>
            </span>
            <button
              className={cn("grid size-10 place-items-center rounded-full xl:hidden", dark ? "hover:bg-cream-50/10" : "hover:bg-night-900/5")}
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X className="size-5" /> : <MenuIcon className="size-5" />}
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div id="mobile-nav" className="fixed inset-0 top-16 z-30 animate-fade-in overflow-y-auto bg-cream-100 xl:hidden" onClick={() => setOpen(false)}>
          <nav className="container-page flex flex-col gap-1 py-6 pb-32" aria-label="Mobile">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="rounded-2xl px-4 py-3.5 font-display text-2xl text-night-900 hover:bg-cream-200">
                {n.label}
              </Link>
            ))}
            <div className="my-3 h-px bg-cream-300" />
            {MORE.map((n) => (
              <Link key={n.href} href={n.href} className="rounded-xl px-4 py-2.5 font-semibold text-night-700 hover:bg-cream-200">
                {n.label}
              </Link>
            ))}
            <div className="my-3 h-px bg-cream-300" />
            <Link href={user ? dashboardHref ?? "/account" : "/login"} className="rounded-xl px-4 py-2.5 font-semibold text-night-700 hover:bg-cream-200">
              {user ? (dashboardHref ? "Dashboard" : "My account") : "Sign in / Create account"}
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}

const TABS = [
  { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  { href: "/menu", label: "Menu", icon: UtensilsCrossed, match: (p: string) => p.startsWith("/menu") || p.startsWith("/order") },
  { href: "/restaurants", label: "Explore", icon: Store, match: (p: string) => p.startsWith("/restaurants") },
  { href: "/account/orders", label: "Orders", icon: Receipt, match: (p: string) => p.startsWith("/account/orders") || p.startsWith("/orders") },
  { href: "/account", label: "Account", icon: User, match: (p: string) => p === "/account" || p.startsWith("/login") || p.startsWith("/signup") },
];

/** App-style bottom tab bar on phones. */
export function MobileTabBar() {
  const pathname = usePathname();
  if (pathname.startsWith("/checkout")) return null;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-200 bg-cream-50/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden" aria-label="App">
      <div className="grid grid-cols-5">
        {TABS.map((t) => {
          const active = t.match(pathname);
          return (
            <Link key={t.href} href={t.href} className={cn("flex flex-col items-center gap-0.5 py-2 text-[0.68rem] font-semibold", active ? "text-ember-600" : "text-night-600")}>
              <t.icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
