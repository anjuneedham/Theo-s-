import type { Metadata } from "next";
import { Bike, Wallet, Clock, Smartphone } from "lucide-react";
import { PageHero } from "@/components/ui/primitives";
import { getSessionUser } from "@/lib/auth/session";
import { getRegions } from "@/lib/services/catalog";
import { getDriverForUser } from "@/lib/services/drivers";
import { DriverApplicationForm } from "@/components/site/driver-application-form";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Drive with Theo's", description: "Deliver with the Theo's Delivery Network. Flexible hours, fair pay and 100% of your tips.", alternates: { canonical: "/drive" } };

export default async function DrivePage() {
  const [user, regions] = await Promise.all([getSessionUser(), getRegions()]);
  const existing = user ? await getDriverForUser(user.id) : null;
  return (
    <>
      <PageHero eyebrow="Drivers" title="Deliver with Theo's">Flexible hours, a simple driver app and 100% of your tips. Payout rates are shared during onboarding.</PageHero>
      <section className="container-page grid gap-10 py-16 lg:grid-cols-[1fr_1.1fr]">
        <ul className="space-y-6">
          {[
            { icon: Clock, t: "Choose your hours", b: "Go online when it suits you." },
            { icon: Wallet, t: "Transparent earnings", b: "See the payout for each job before you accept it." },
            { icon: Smartphone, t: "Simple driver app", b: "Accept jobs, get pickup details and mark deliveries done from your phone." },
            { icon: Bike, t: "Any vehicle", b: "Motorbike, car or bicycle for short trips." },
          ].map((x) => (
            <li key={x.t} className="flex gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-ember-50 text-ember-600"><x.icon className="size-6" /></span>
              <div><p className="font-bold">{x.t}</p><p className="text-sm text-night-600">{x.b}</p></div>
            </li>
          ))}
        </ul>
        <div className="card p-6 sm:p-8">
          {!user ? (
            <div className="text-center">
              <h2 className="text-2xl">Create an account to apply</h2>
              <p className="mt-2 text-night-600">You&apos;ll use the same login for the driver app.</p>
              <div className="mt-6 flex justify-center gap-3"><ButtonLink href="/signup?next=/drive">Create account</ButtonLink><ButtonLink href="/login?next=/drive" variant="secondary">Sign in</ButtonLink></div>
            </div>
          ) : existing ? (
            <div className="text-center">
              <h2 className="text-2xl">{existing.is_approved ? "You're approved!" : "Application under review"}</h2>
              <p className="mt-2 text-night-600">{existing.is_approved ? "Open the driver app to go online." : "We'll contact you once your documents are checked."}</p>
              {existing.is_approved && <ButtonLink href="/driver" className="mt-6">Open driver app</ButtonLink>}
            </div>
          ) : (
            <DriverApplicationForm name={user.full_name} phone={user.phone ?? ""} regions={regions.map((r) => ({ id: r.id, name: r.name }))} />
          )}
        </div>
      </section>
    </>
  );
}
