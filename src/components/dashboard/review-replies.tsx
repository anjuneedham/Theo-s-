"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Review } from "@/lib/types";
import { Stars, Textarea, EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { toast } from "@/components/ui/toast";

export function ReviewReplies({ restaurantId, reviews }: { restaurantId: string; reviews: Review[] }) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  if (!reviews.length) return <EmptyState title="No reviews yet">Reviews appear here after customers rate delivered orders.</EmptyState>;
  return (
    <ul className="grid gap-4 lg:grid-cols-2">
      {reviews.map((r) => (
        <li key={r.id} className="card p-5">
          <div className="flex items-center justify-between">
            <Stars rating={r.rating} />
            <span className="text-xs text-night-600">{r.author_name} · {new Date(r.created_at).toLocaleDateString()}</span>
          </div>
          <p className="mt-2 text-sm">{r.comment ?? <span className="text-night-600">(no comment)</span>}</p>
          <Textarea className="mt-3 min-h-16 text-sm" placeholder="Write a public reply…" value={drafts[r.id] ?? r.reply ?? ""} onChange={(e) => setDrafts({ ...drafts, [r.id]: e.target.value })} aria-label="Reply" />
          <Button
            size="sm"
            className="mt-2"
            onClick={async () => {
              try {
                await api(`/api/v1/partner/${restaurantId}/reviews/${r.id}`, { method: "PATCH", body: { reply: drafts[r.id] ?? r.reply ?? null } });
                toast.success("Reply saved");
                router.refresh();
              } catch (e) {
                toast.error((e as Error).message);
              }
            }}
          >
            {r.reply ? "Update reply" : "Reply"}
          </Button>
        </li>
      ))}
    </ul>
  );
}
