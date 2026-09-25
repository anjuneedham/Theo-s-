import { getSettings } from "@/lib/services/catalog";
import { onlineProvider } from "@/lib/payments";
import { channels } from "@/lib/notifications/channels";
import { config } from "@/lib/config";
import { PageHeader } from "@/components/dashboard/shell";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { Panel } from "@/components/dashboard/widgets";

export default async function AdminSettings() {
  const settings = await getSettings();
  const provider = onlineProvider();
  const integrations = [
    { name: "Database", ok: config.dataBackend === "supabase", detail: config.dataBackend === "supabase" ? "Supabase (PostgreSQL)" : "Local JSON store — development only" },
    { name: "Online payments", ok: Boolean(provider), detail: provider ? provider.label : "Not connected — only cash / card on delivery are offered" },
    { name: "Email (Resend)", ok: channels.email.isConfigured(), detail: channels.email.isConfigured() ? "Connected" : "Set RESEND_API_KEY and EMAIL_FROM" },
    { name: "SMS (Twilio)", ok: channels.sms.isConfigured(), detail: channels.sms.isConfigured() ? "Connected" : "Set TWILIO_* variables" },
    { name: "WhatsApp (Twilio)", ok: channels.whatsapp.isConfigured(), detail: channels.whatsapp.isConfigured() ? "Connected" : "Needs an approved WhatsApp sender" },
    { name: "Push notifications", ok: false, detail: "Not implemented yet (see ROADMAP.md)" },
  ];
  return (
    <>
      <PageHeader title="Fees & settings" description="All business-model rates are configurable. Changes apply to new orders; past orders keep the split they were placed with." />
      <Panel title="Integrations status" className="mb-6">
        <ul className="grid gap-px bg-cream-200 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((i) => (
            <li key={i.name} className="bg-white p-4 text-sm">
              <p className="flex items-center gap-2 font-semibold"><span className={`size-2 rounded-full ${i.ok ? "bg-leaf-500" : "bg-gold-500"}`} />{i.name}</p>
              <p className="mt-0.5 text-night-600">{i.detail}</p>
            </li>
          ))}
        </ul>
      </Panel>
      <SettingsForm initial={settings} />
    </>
  );
}
