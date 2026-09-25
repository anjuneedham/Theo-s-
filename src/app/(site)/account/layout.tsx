import { requirePageUser } from "@/lib/auth/guards";
import { AccountNav } from "@/components/account/account-nav";

export const metadata = { title: "My account", robots: { index: false } };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser("/account");
  return (
    <div className="container-page py-8 pb-28 lg:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">My account</p>
          <h1 className="mt-1 text-4xl">Hi, {user.full_name.split(" ")[0] || "there"}</h1>
        </div>
      </div>
      <AccountNav />
      <div className="mt-8">{children}</div>
    </div>
  );
}
