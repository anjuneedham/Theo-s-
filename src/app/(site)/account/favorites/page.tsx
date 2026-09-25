import Link from "next/link";
import { Heart } from "lucide-react";
import { requirePageUser } from "@/lib/auth/guards";
import { listFavorites } from "@/lib/services/customers";
import { EmptyState } from "@/components/ui/primitives";
import { DishImage } from "@/components/ui/dish-image";
import { ButtonLink } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";

export default async function FavoritesPage() {
  const user = await requirePageUser("/account/favorites");
  const { restaurants, items } = await listFavorites(user.id);
  if (!restaurants.length && !items.length) {
    return (
      <EmptyState icon={<Heart className="size-6" />} title="No favourites yet" action={<ButtonLink href="/restaurants">Explore restaurants</ButtonLink>}>
        Tap the heart on a restaurant to save it here.
      </EmptyState>
    );
  }
  return (
    <div className="space-y-10">
      {restaurants.length > 0 && (
        <section>
          <h2 className="text-2xl">Restaurants</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((r) => (
              <li key={r.id}>
                <Link href={r.is_anchor ? "/order" : `/restaurants/${r.slug}`} className="card block p-5 hover:shadow-[var(--shadow-lift)]">
                  <p className="font-bold">{r.name}</p>
                  <p className="text-sm text-night-600">{r.tagline}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {items.length > 0 && (
        <section>
          <h2 className="text-2xl">Dishes</h2>
          <ul className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {items.map(({ item, restaurant }) => (
              <li key={item.id}>
                <Link href={restaurant?.is_anchor ? "/order" : `/restaurants/${restaurant?.slug}`}>
                  <DishImage name={item.name} imageUrl={item.image_url} className="aspect-[4/3] rounded-xl" />
                  <p className="mt-2 text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-night-600">{restaurant?.name} · {formatMoney(item.price_cents)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
