import { requirePageUser } from "@/lib/auth/guards";
import { DashboardShell, type NavItem } from "@/components/dashboard/shell";
import { getDb } from "@/lib/db";
import { config } from "@/lib/config";

export const metadata = { title: "Admin", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePageUser("/admin", ["admin"]);
  const db = getDb();
  const [pendingRestaurants, newMessages, pendingDrivers, unassigned] = await Promise.all([
    db.count("restaurants", { status: "pending" }),
    db.count("contact_messages", { status: "new" }),
    db.count("drivers", { is_approved: false }),
    db.count("deliveries", { status: "unassigned" }),
  ]);
  const nav: NavItem[] = [
    { href: "/admin", label: "Overview", icon: "LayoutDashboard", exact: true },
    { href: "/admin/orders", label: "Orders", icon: "Receipt" },
    { href: "/admin/restaurants", label: "Restaurants", icon: "Store", badge: pendingRestaurants },
    { href: "/admin/menus", label: "Menus & zones", icon: "UtensilsCrossed" },
    { href: "/admin/drivers", label: "Deliveries & drivers", icon: "Bike", badge: pendingDrivers + unassigned },
    { href: "/admin/customers", label: "Customers", icon: "Users" },
    { href: "/admin/promotions", label: "Promotions", icon: "BadgePercent" },
    { href: "/admin/payouts", label: "Payouts", icon: "Wallet" },
    { href: "/admin/analytics", label: "Analytics", icon: "BarChart3" },
    { href: "/admin/messages", label: "Messages", icon: "Mail", badge: newMessages },
    { href: "/admin/users", label: "Users & roles", icon: "UserCog" },
    { href: "/admin/settings", label: "Fees & settings", icon: "Settings" },
  ];
  return (
    <DashboardShell
      title="Theo's Network"
      subtitle="Platform admin"
      nav={nav}
      banner={config.dataBackend === "local" ? <div className="bg-gold-300/40 px-4 py-1.5 text-center text-xs font-semibold text-night-800">Local demo data (includes sample orders) — connect Supabase for production. See SETUP.md.</div> : undefined}
    >
      {children}
    </DashboardShell>
  );
}
