import { getDb } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/shell";
import { ProfileEditor } from "@/components/dashboard/profile-editor";

export default async function ProfilePage({ params }: { params: Promise<{ rid: string }> }) {
  const { rid } = await params;
  const r = (await getDb().get("restaurants", rid))!;
  return (
    <>
      <PageHeader title="Restaurant profile" description="What customers see on your restaurant page and at checkout." />
      <ProfileEditor restaurant={r} />
    </>
  );
}
