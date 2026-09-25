"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics-client";

export function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname.startsWith("/partner/") || pathname.startsWith("/driver")) return;
    track("page_view");
  }, [pathname]);
  return null;
}
