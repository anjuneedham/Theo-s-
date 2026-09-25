"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { toast } from "@/components/ui/toast";

export function RefundButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      size="sm"
      variant="danger"
      loading={busy}
      onClick={async () => {
        if (!confirm("Refund the remaining amount for this order?")) return;
        setBusy(true);
        try {
          await api(`/api/v1/orders/${orderId}/refund`, { body: {} });
          toast.success("Refund recorded");
          router.refresh();
        } catch (e) {
          toast.error((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      Refund payment
    </Button>
  );
}
