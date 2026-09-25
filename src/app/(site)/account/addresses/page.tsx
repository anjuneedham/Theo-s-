import { requirePageUser } from "@/lib/auth/guards";
import { listAddresses } from "@/lib/services/customers";
import { getDb } from "@/lib/db";
import { AddressManager } from "@/components/account/address-manager";

export default async function AddressesPage() {
  const user = await requirePageUser("/account/addresses");
  const [addresses, zones] = await Promise.all([listAddresses(user.id), getDb().list("delivery_zones", { is_active: true })]);
  const areas = [...new Set(zones.flatMap((z) => z.areas))].sort();
  return <AddressManager initial={addresses} areas={areas} />;
}
