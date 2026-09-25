import Link from "next/link";
import { Bell } from "lucide-react";
import { requirePageUser } from "@/lib/auth/guards";
import { listNotifications, markNotificationsRead } from "@/lib/services/customers";
import { EmptyState } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

export default async function NotificationsPage() {
  const user = await requirePageUser("/account/notifications");
  const notifications = await listNotifications(user.id);
  await markNotificationsRead(user.id);
  if (!notifications.length) return <EmptyState icon={<Bell className="size-6" />} title="No notifications">Order updates will appear here.</EmptyState>;
  return (
    <ul className="divide-y divide-cream-200 rounded-3xl border border-cream-200 bg-white">
      {notifications.map((n) => (
        <li key={n.id} className={cn("flex gap-3 p-4", !n.read_at && "bg-gold-300/10")}>
          <span className={cn("mt-2 size-2 shrink-0 rounded-full", n.read_at ? "bg-cream-300" : "bg-ember-500")} />
          <div className="min-w-0">
            <p className="font-semibold">{n.title}</p>
            <p className="text-sm text-night-600">{n.body.split("\n")[0]}</p>
            <p className="mt-1 text-xs text-night-600">
              {new Date(n.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Jamaica" })}
              {n.order_id && <> · <Link href={`/orders/${n.order_id}`} className="font-semibold text-ember-600">View order</Link></>}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
