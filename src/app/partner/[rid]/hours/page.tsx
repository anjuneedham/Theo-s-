import { getHours } from "@/lib/services/catalog";
import { PageHeader } from "@/components/dashboard/shell";
import { HoursEditor } from "@/components/dashboard/hours-editor";

export default async function HoursPage({ params }: { params: Promise<{ rid: string }> }) {
  const { rid } = await params;
  const hours = await getHours(rid);
  return (
    <>
      <PageHeader title="Opening hours" description="Orders can only be placed (or scheduled) while you're open. For late nights, set a closing time after midnight, e.g. 11:00 → 02:00." />
      <HoursEditor restaurantId={rid} initial={hours} />
    </>
  );
}
