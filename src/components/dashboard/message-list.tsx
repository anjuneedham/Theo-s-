"use client";

import { useRouter } from "next/navigation";
import type { ContactMessage } from "@/lib/types";
import { EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/cn";

export function MessageList({ messages }: { messages: ContactMessage[] }) {
  const router = useRouter();
  if (!messages.length) return <EmptyState title="No messages yet">Contact form submissions will appear here.</EmptyState>;
  const set = async (id: string, status: ContactMessage["status"]) => {
    await api(`/api/v1/admin/messages/${id}`, { method: "PATCH", body: { status } });
    router.refresh();
  };
  return (
    <ul className="space-y-3">
      {messages.map((m) => (
        <li key={m.id} className={cn("card p-5", m.status === "new" && "ring-2 ring-gold-400", m.status === "archived" && "opacity-60")}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-bold">{m.name} <span className="ml-2 rounded-full bg-cream-200 px-2 py-0.5 text-xs font-semibold capitalize">{m.topic}</span></p>
              <p className="text-xs text-night-600"><a href={`mailto:${m.email}`} className="underline">{m.email}</a>{m.phone && ` · ${m.phone}`} · {new Date(m.created_at).toLocaleString()}</p>
            </div>
            <div className="flex gap-1.5">
              {m.status === "new" && <Button size="sm" variant="secondary" onClick={() => set(m.id, "read")}>Mark read</Button>}
              {m.status !== "archived" && <Button size="sm" variant="ghost" onClick={() => set(m.id, "archived")}>Archive</Button>}
            </div>
          </div>
          <p className="mt-3 whitespace-pre-line text-sm">{m.message}</p>
        </li>
      ))}
    </ul>
  );
}
