import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";

export const metadata = { title: "Access denied", robots: { index: false } };

export default function Forbidden() {
  return (
    <div className="container-page max-w-2xl py-20">
      <EmptyState icon={<ShieldAlert className="size-6" />} title="You don't have access to that page" action={<ButtonLink href="/">Back to home</ButtonLink>}>
        If you think this is a mistake, sign in with a different account or contact the platform administrator.
      </EmptyState>
    </div>
  );
}
