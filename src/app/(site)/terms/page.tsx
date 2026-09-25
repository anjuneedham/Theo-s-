import type { Metadata } from "next";
import { PageHero } from "@/components/ui/primitives";
import { getSettings } from "@/lib/services/catalog";

export const metadata: Metadata = { title: "Terms of Service", alternates: { canonical: "/terms" } };

export default async function TermsPage() {
  const s = await getSettings();
  return (
    <>
      <PageHero eyebrow="Legal" title="Terms of Service" dark={false}>Last updated: September 2026. <strong>Draft — have this reviewed by an attorney before launch.</strong></PageHero>
      <article className="container-page prose-theos max-w-3xl py-12">
        <h2>1. The service</h2>
        <p>{s.platform_name} lets you order food and drink from Theo&apos;s Restaurant &amp; Lounge and participating partner restaurants for pickup or delivery. Each restaurant is responsible for the food it prepares.</p>
        <h2>2. Orders and pricing</h2>
        <ul>
          <li>Prices, delivery fees and any service fee are shown before you place your order. The total at checkout is the amount you pay.</li>
          <li>An order is accepted when the restaurant confirms it. Restaurants may decline orders, for example if an item is unavailable.</li>
          <li>Delivery times are estimates.</li>
        </ul>
        <h2>3. Payment</h2>
        <p>Cash and card-on-delivery orders are paid when you receive them. Online payments are processed by our payment provider; you are only charged for confirmed orders, and cancelled paid orders are refunded.</p>
        <h2>4. Cancellations</h2>
        <p>You may cancel while your order is pending. After confirmation, contact the restaurant. Repeatedly refused cash orders may lead to cash payment being disabled on your account.</p>
        <h2>5. Alcohol</h2>
        <p>Alcohol is only sold to persons aged 18 and over. Valid ID is required on pickup and delivery, and we may refuse to hand over alcohol without it.</p>
        <h2>6. Reviews</h2>
        <p>Reviews must relate to a genuine order and must not be abusive. We may remove reviews that break these rules.</p>
        <h2>7. Partner restaurants and drivers</h2>
        <p>Partner restaurants and drivers agree to separate partner terms covering commission, fees and payouts.</p>
        <h2>8. Contact</h2>
        <p>{s.support_email} · {s.support_phone}</p>
      </article>
    </>
  );
}
