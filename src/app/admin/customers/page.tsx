import { customerSummaries } from "@/lib/services/admin";
import { PageHeader } from "@/components/dashboard/shell";
import { Panel, DataTable, Td } from "@/components/dashboard/widgets";
import { formatMoney } from "@/lib/money";

export default async function AdminCustomers() {
  const rows = await customerSummaries();
  return (
    <>
      <PageHeader title="Customers" description={`${rows.length} registered customer accounts. Guest orders are not linked to an account.`} />
      <Panel>
        <DataTable head={["Customer", "Phone", "Orders", "Total spent", "Last order", "Marketing"]}>
          {rows.map(({ profile: p, orders, spentCents, lastOrderAt }) => (
            <tr key={p.id}>
              <Td><p className="font-semibold">{p.full_name || "—"}</p><p className="text-xs text-night-600">{p.email}</p></Td>
              <Td>{p.phone ?? "—"}</Td>
              <Td>{orders}</Td>
              <Td>{formatMoney(spentCents)}</Td>
              <Td>{lastOrderAt ? new Date(lastOrderAt).toLocaleDateString() : "—"}</Td>
              <Td>{p.marketing_opt_in ? "Opted in" : "—"}</Td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </>
  );
}
