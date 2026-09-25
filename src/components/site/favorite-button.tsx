"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/cn";
import { api } from "@/lib/api-client";
import { toast } from "@/components/ui/toast";

export function FavoriteButton({ restaurantId, menuItemId, initial, signedIn, className }: { restaurantId?: string; menuItemId?: string; initial: boolean; signedIn: boolean; className?: string }) {
  const [on, setOn] = useState(initial);
  const router = useRouter();
  return (
    <button
      aria-label={on ? "Remove from favourites" : "Save to favourites"}
      aria-pressed={on}
      className={cn("grid size-9 place-items-center rounded-full bg-white shadow ring-1 ring-cream-200 transition hover:scale-105", className)}
      onClick={async (e) => {
        e.preventDefault();
        if (!signedIn) {
          router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
          return;
        }
        setOn(!on);
        try {
          const res = await api<{ favorited: boolean }>("/api/v1/me/favorites", { body: { restaurant_id: restaurantId ?? null, menu_item_id: menuItemId ?? null } });
          setOn(res.favorited);
          toast.success(res.favorited ? "Saved to favourites" : "Removed from favourites");
        } catch (err) {
          setOn(on);
          toast.error((err as Error).message);
        }
      }}
    >
      <Heart className={cn("size-4", on ? "fill-ember-500 text-ember-500" : "text-night-700")} />
    </button>
  );
}
