import { notFound } from "next/navigation";
import { requirePageUser, managedRestaurants } from "@/lib/auth/guards";
import { DashboardShell, type NavItem } from "@/components/dashboard/shell";
import { RestaurantSwitcher } from "@/components/dashboard/restaurant-switcher";
import { getDb } from "@/lib/db";
import { config } from "@/lib/config";

export const metadata = { title: "Partner dashboard", robots: { index: false } };

export default async function PartnerLayout({ children, params }: { children: React.ReactNode; params: Promise<{ rid: string }> }) {
  const { rid } = await params;
  const user = await requirePageUser(`/partner/${rid}`);
  const list = await managedRestaurants(user);
  const access = list.find((a) => a.restaurant.id === rid);
  if (!access) notFound();
  const r = access.restaurant;
  const pending = await getDb().count("orders", { restaurant_id: rid, status: "pending" });
  const base = `/partner/${rid}`;
  const nav: NavItem[] = [
    { href: base, label: "Overview", icon: "LayoutDashboard", exact: true },
    { href: `${base}/orders`, label: "Orders", icon: "Receipt", badge: pending },
    { href: `${base}/menu`, label: "Menu", icon: "UtensilsCrossed" },
    { href: `${base}/profile`, label: "Restaurant profile", icon: "Store" },
    { href: `${base}/hours`, label: "Opening hours", icon: "Clock" },
    { href: `${base}/zones`, label: "Delivery zones", icon: "MapPinned" },
    { href: `${base}/promotions`, label: "Promotions", icon: "BadgePercent" },
    { href: `${base}/payouts`, label: "Payouts", icon: "Wallet" },
    { href: `${base}/reviews`, label: "Reviews", icon: "Star" },
  ];
  const banner =
    r.status !== "active" ? (
      <div className="bg-gold-300/40 px-4 py-2.5 text-center text-sm font-semibold text-night-800">
        {r.status === "pending" ? "Your restaurant is pending approval — set up your menu, hours and zones now; customers will see it once approved." : `This restaurant is ${r.status}. Contact the platform team.`}
      </div>
    ) : config.dataBackend === "local" ? (
      <div className="bg-cream-200 px-4 py-1.5 text-center text-xs text-night-600">Local demo data — connect Supabase for production (see SETUP.md).</div>
    ) : null;
  return (
    <DashboardShell
      title={r.name}
      subtitle={access.role === "admin" ? "Admin view" : `Partner · ${access.role}`}
      nav={nav}
      banner={banner}
      switcher={list.length > 1 ? <RestaurantSwitcher current={rid} options={list.map((a) => ({ id: a.restaurant.id, name: a.restaurant.name }))} /> : undefined}
    >
      {children}
    </DashboardShell>
  );
}
