"use client";

import { LogOut } from "lucide-react";
import { cn } from "@/lib/cn";

export function LogoutButton({ className, light }: { className?: string; light?: boolean }) {
  return (
    <button
      onClick={async () => {
        await fetch("/api/v1/auth/logout", { method: "POST" });
        window.location.href = "/";
      }}
      className={cn("inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold", light ? "text-cream-200/80 hover:bg-cream-50/10" : "text-night-600 hover:bg-night-900/5", className)}
    >
      <LogOut className="size-4" /> Sign out
    </button>
  );
}
