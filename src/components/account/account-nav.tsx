"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { LogoutButton } from "./logout-button";

const TABS = [
  ["/account", "Profile"],
  ["/account/orders", "Orders"],
  ["/account/addresses", "Addresses"],
  ["/account/favorites", "Favourites"],
  ["/account/reviews", "Reviews"],
  ["/account/notifications", "Notifications"],
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <div className="mt-6 flex items-center gap-3 border-b border-cream-200">
      <nav className="no-scrollbar -mb-px flex flex-1 gap-1 overflow-x-auto" aria-label="Account">
        {TABS.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className={cn("shrink-0 border-b-2 px-3 py-3 text-sm font-semibold", pathname === href ? "border-ember-500 text-night-900" : "border-transparent text-night-600 hover:text-night-900")}
          >
            {label}
          </Link>
        ))}
      </nav>
      <LogoutButton className="hidden sm:inline-flex" />
    </div>
  );
}
