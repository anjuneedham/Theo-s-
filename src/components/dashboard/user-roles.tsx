"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Profile, UserRole } from "@/lib/types";
import { Input, Select } from "@/components/ui/primitives";
import { Panel, DataTable, Td } from "./widgets";
import { api } from "@/lib/api-client";
import { toast } from "@/components/ui/toast";

export function UserRoles({ users, meId }: { users: Profile[]; meId: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const shown = users.filter((u) => !q || `${u.full_name} ${u.email}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <Panel action={<Input placeholder="Search users" value={q} onChange={(e) => setQ(e.target.value)} className="w-64 py-2 text-sm" aria-label="Search users" />} title={`${users.length} users`}>
      <DataTable head={["User", "Joined", "Role"]}>
        {shown.map((u) => (
          <tr key={u.id}>
            <Td><p className="font-semibold">{u.full_name || "—"}</p><p className="text-xs text-night-600">{u.email}</p></Td>
            <Td>{new Date(u.created_at).toLocaleDateString()}</Td>
            <Td>
              <Select
                aria-label={`Role for ${u.email}`}
                value={u.role}
                disabled={u.id === meId}
                className="w-40 py-2 text-sm"
                onChange={async (e) => {
                  const role = e.target.value as UserRole;
                  if (role === "admin" && !confirm(`Give ${u.email} full admin access?`)) return;
                  try {
                    await api(`/api/v1/admin/users/${u.id}`, { method: "PATCH", body: { role } });
                    toast.success("Role updated");
                    router.refresh();
                  } catch (err) {
                    toast.error((err as Error).message);
                  }
                }}
              >
                {["customer", "restaurant", "driver", "admin"].map((r) => <option key={r} value={r}>{r}</option>)}
              </Select>
            </Td>
          </tr>
        ))}
      </DataTable>
    </Panel>
  );
}
