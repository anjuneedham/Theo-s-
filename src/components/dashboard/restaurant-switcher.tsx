"use client";

import { useRouter, usePathname } from "next/navigation";

export function RestaurantSwitcher({ current, options }: { current: string; options: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <select
      aria-label="Switch restaurant"
      value={current}
      onChange={(e) => router.push(pathname.replace(current, e.target.value))}
      className="w-full rounded-xl border border-cream-50/15 bg-night-800 px-3 py-2 text-sm text-cream-50"
    >
      {options.map((o) => (
        <option key={o.id} value={o.id}>{o.name}</option>
      ))}
    </select>
  );
}
