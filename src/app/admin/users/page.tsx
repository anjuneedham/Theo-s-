import { listUsers } from "@/lib/services/admin";
import { requirePageUser } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/shell";
import { UserRoles } from "@/components/dashboard/user-roles";

export default async function AdminUsers() {
  const me = await requirePageUser("/admin/users", ["admin"]);
  const users = await listUsers();
  return (
    <>
      <PageHeader title="Users & roles" description="Platform roles: customer, restaurant (staff access comes from restaurant membership), driver, admin." />
      <UserRoles users={users} meId={me.id} />
    </>
  );
}
