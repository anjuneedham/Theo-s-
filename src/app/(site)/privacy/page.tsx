import type { Metadata } from "next";
import { PageHero } from "@/components/ui/primitives";
import { getSettings } from "@/lib/services/catalog";

export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy" } };

export default async function PrivacyPage() {
  const s = await getSettings();
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy Policy" dark={false}>Last updated: September 2026. <strong>Draft — have this reviewed by a Jamaican attorney (Data Protection Act, 2020) before launch.</strong></PageHero>
      <article className="container-page prose-theos max-w-3xl py-12">
        <p>This policy explains how Theo&apos;s Restaurant &amp; Lounge and the Theo&apos;s Delivery Network (“we”, “us”) collect and use personal information when you use our website and apps.</p>
        <h2>Information we collect</h2>
        <ul>
          <li><strong>Order details:</strong> your name, phone number, email (optional), delivery address and the items you order.</li>
          <li><strong>Account details:</strong> if you create an account, your saved addresses, favourites, reviews and order history.</li>
          <li><strong>Payment information:</strong> for online payments, card details are entered with our payment provider and are never stored on our servers. We keep a transaction reference and payment status.</li>
          <li><strong>Usage data:</strong> anonymous, cookie-free events such as pages and menu items viewed, used to improve the service.</li>
          <li><strong>Location:</strong> only if you choose “Locate me” at checkout, to find your delivery zone.</li>
        </ul>
        <h2>How we use it</h2>
        <ul>
          <li>To prepare, deliver and support your order, including sending order status updates by email, SMS or WhatsApp.</li>
          <li>To share the details needed to fulfil your order with the restaurant you ordered from and the assigned driver. Drivers only see your contact details after accepting your delivery.</li>
          <li>To send marketing only if you opted in. You can opt out at any time from your account.</li>
          <li>To prevent fraud and meet legal and tax obligations.</li>
        </ul>
        <h2>Retention</h2>
        <p>We keep order records for as long as needed for accounting and legal purposes. You can ask us to delete your account at any time.</p>
        <h2>Your rights</h2>
        <p>You may request access to, correction of, or deletion of your personal data by contacting <a href={`mailto:${s.support_email}`}>{s.support_email}</a>.</p>
        <h2>Security</h2>
        <p>Data is encrypted in transit, access is restricted by role, and database access is protected with row-level security.</p>
        <h2>Contact</h2>
        <p>{s.support_email} · {s.support_phone}</p>
      </article>
    </>
  );
}
