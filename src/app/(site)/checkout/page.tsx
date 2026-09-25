import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth/session";
import { getSettings } from "@/lib/services/catalog";
import { listAddresses } from "@/lib/services/customers";
import { availablePaymentMethods } from "@/lib/payments";
import { getDb } from "@/lib/db";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const user = await getSessionUser();
  const settings = await getSettings();
  const addresses = user ? await listAddresses(user.id) : [];
  // Areas served per restaurant, so the client can offer a picker for whichever restaurant is in the cart.
  const zones = await getDb().list("delivery_zones", { is_active: true });
  const areasByRestaurant: Record<string, string[]> = {};
  for (const z of zones) areasByRestaurant[z.restaurant_id] = [...(areasByRestaurant[z.restaurant_id] ?? []), ...z.areas].sort();
  return (
    <CheckoutForm
      user={user ? { name: user.full_name, email: user.email, phone: user.phone } : null}
      addresses={addresses}
      paymentMethods={availablePaymentMethods(settings.payment_methods)}
      allowGuest={settings.allow_guest_checkout}
      areasByRestaurant={areasByRestaurant}
    />
  );
}
