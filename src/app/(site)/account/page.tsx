import Link from "next/link";
import { requirePageUser } from "@/lib/auth/guards";
import { getDb } from "@/lib/db";
import { favoriteMealsFromHistory } from "@/lib/services/customers";
import { ProfileForm } from "@/components/account/profile-form";
import { LogoutButton } from "@/components/account/logout-button";
import { DishImage } from "@/components/ui/dish-image";
import { formatMoney } from "@/lib/money";
import { ButtonLink } from "@/components/ui/button";

export default async function AccountPage() {
  const user = await requirePageUser("/account");
  const profile = await getDb().get("profiles", user.id);
  const meals = await favoriteMealsFromHistory(user.id, 4);
  const driverApp = user.role === "customer" ? await getDb().findOne("drivers", { user_id: user.id }) : null;
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <section className="card p-6">
        <h2 className="font-sans text-lg font-bold">Profile</h2>
        <ProfileForm initial={{ full_name: profile?.full_name ?? "", phone: profile?.phone ?? "", email: user.email, marketing_opt_in: profile?.marketing_opt_in ?? false }} />
      </section>
      <div className="space-y-6">
        <section className="card p-6">
          <h2 className="font-sans text-lg font-bold">Your usual</h2>
          {meals.length === 0 ? (
            <p className="mt-2 text-sm text-night-600">Your most-ordered dishes will appear here for one-tap reordering.</p>
          ) : (
            <ul className="mt-4 grid grid-cols-2 gap-3">
              {meals.map(({ item, count }) => (
                <li key={item.id}>
                  <Link href="/order" className="block">
                    <DishImage name={item.name} imageUrl={item.image_url} className="aspect-[4/3] rounded-xl" />
                    <p className="mt-2 text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-night-600">Ordered {count}× · {formatMoney(item.price_cents)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <ButtonLink href="/account/orders" variant="secondary" size="sm" className="mt-4">Order history</ButtonLink>
        </section>
        <section className="card p-6">
          <h2 className="font-sans text-lg font-bold">Work with Theo&apos;s</h2>
          <p className="mt-1 text-sm text-night-600">Own a restaurant or want to deliver with us?</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <ButtonLink href="/partners/apply" size="sm" variant="secondary">List your restaurant</ButtonLink>
            {driverApp ? (
              <span className="rounded-full bg-cream-200 px-3 py-2 text-xs font-semibold">Driver application {driverApp.is_approved ? "approved" : "under review"}</span>
            ) : (
              <ButtonLink href="/drive" size="sm" variant="secondary">Become a driver</ButtonLink>
            )}
          </div>
        </section>
        <LogoutButton className="sm:hidden" />
      </div>
    </div>
  );
}
