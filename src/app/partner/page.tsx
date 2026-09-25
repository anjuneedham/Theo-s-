import { redirect } from "next/navigation";
import { requirePageUser, managedRestaurants } from "@/lib/auth/guards";
import { EmptyState } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { Store } from "lucide-react";

export const metadata = { title: "Partner dashboard", robots: { index: false } };

export default async function PartnerIndex() {
  const user = await requirePageUser("/partner");
  const list = await managedRestaurants(user);
  if (list.length > 0) redirect(`/partner/${(list.find((a) => a.restaurant.is_anchor && user.role !== "admin") ?? list[0]).restaurant.id}`);
  return (
    <div className="grid min-h-dvh place-items-center bg-cream-100 px-4">
      <div className="w-full max-w-lg">
        <EmptyState icon={<Store className="size-6" />} title="No restaurant linked to this account" action={<ButtonLink href="/partners/apply">Apply to become a partner</ButtonLink>}>
          If your restaurant is already on Theo&apos;s, ask the owner to add you as staff.
        </EmptyState>
      </div>
    </div>
  );
}
