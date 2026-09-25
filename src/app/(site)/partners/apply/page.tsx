import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { getRegions, getRestaurantCategories } from "@/lib/services/catalog";
import { PartnerApplicationForm } from "@/components/site/partner-application-form";

export const metadata: Metadata = { title: "Apply to become a partner restaurant", alternates: { canonical: "/partners/apply" } };

export default async function ApplyPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams;
  const [user, regions, categories, plans] = await Promise.all([getSessionUser(), getRegions(), getRestaurantCategories(), getDb().list("subscription_plans", { is_active: true }, { orderBy: "sort_order" })]);
  return (
    <div className="container-page max-w-3xl py-12 pb-28">
      <p className="eyebrow">Partner application</p>
      <h1 className="mt-2 text-4xl">Tell us about your restaurant</h1>
      <p className="mt-2 text-night-600">We review every application personally and will contact you within 2 business days.</p>
      <PartnerApplicationForm
        user={user ? { name: user.full_name, email: user.email, phone: user.phone } : null}
        regions={regions.map((r) => ({ id: r.id, name: r.name }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        plans={plans.map((p) => ({ id: p.id, slug: p.slug, name: p.name }))}
        initialPlan={plan}
      />
    </div>
  );
}
