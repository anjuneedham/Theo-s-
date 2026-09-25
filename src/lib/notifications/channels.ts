import type { NotificationChannel } from "../types";

export interface OutboundMessage {
  to: string;
  subject: string;
  body: string;
}

export interface Channel {
  id: Exclude<NotificationChannel, "in_app">;
  isConfigured(): boolean;
  send(message: OutboundMessage): Promise<void>;
}

/** Email via Resend (https://resend.com). Needs RESEND_API_KEY and EMAIL_FROM. */
export const emailChannel: Channel = {
  id: "email",
  isConfigured: () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
  async send({ to, subject, body }) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, text: body }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  },
};

async function twilioSend(from: string, to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ From: from, To: to, Body: body }),
  });
  if (!res.ok) throw new Error(`Twilio ${res.status}: ${await res.text()}`);
}

/** Normalise Jamaican numbers like "(876) 555-0142" to E.164 (+18765550142). */
export function toE164(phone: string, defaultCountryCode = "1"): string | null {
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits.length >= 8 ? digits : null;
  if (digits.length === 7) return `+${defaultCountryCode}876${digits}`;
  if (digits.length === 10) return `+${defaultCountryCode}${digits}`;
  if (digits.length === 11 && digits.startsWith(defaultCountryCode)) return `+${digits}`;
  return null;
}

/** SMS via Twilio. Needs TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM. */
export const smsChannel: Channel = {
  id: "sms",
  isConfigured: () => Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_SMS_FROM),
  async send({ to, body }) {
    const e164 = toE164(to);
    if (!e164) throw new Error("Invalid phone number");
    await twilioSend(process.env.TWILIO_SMS_FROM!, e164, body);
  },
};

/**
 * WhatsApp via Twilio's WhatsApp Business API. Only enabled when an approved
 * sender is connected (TWILIO_WHATSAPP_FROM, e.g. "whatsapp:+1876…"). Business-
 * initiated messages outside the 24h window require Meta-approved templates.
 */
export const whatsappChannel: Channel = {
  id: "whatsapp",
  isConfigured: () =>
    Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM),
  async send({ to, body }) {
    const e164 = toE164(to);
    if (!e164) throw new Error("Invalid phone number");
    await twilioSend(process.env.TWILIO_WHATSAPP_FROM!, `whatsapp:${e164}`, body);
  },
};

/**
 * Web push. Requires VAPID keys (WEB_PUSH_PUBLIC_KEY / WEB_PUSH_PRIVATE_KEY), a
 * stored PushSubscription per device, and the `web-push` package. Not wired yet —
 * reported as "skipped" so nothing claims a push was delivered.
 */
export const pushChannel: Channel = {
  id: "push",
  isConfigured: () => false,
  async send() {
    throw new Error("Web push is not configured");
  },
};

export const channels = { email: emailChannel, sms: smsChannel, whatsapp: whatsappChannel, push: pushChannel };
