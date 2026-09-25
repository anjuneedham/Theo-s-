import { getDb } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/shell";
import { MessageList } from "@/components/dashboard/message-list";

export default async function AdminMessages() {
  const messages = await getDb().list("contact_messages", {}, { orderBy: "created_at", ascending: false, limit: 200 });
  return (
    <>
      <PageHeader title="Messages" description="Enquiries from the contact form." />
      <MessageList messages={messages} />
    </>
  );
}
