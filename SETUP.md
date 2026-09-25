# Setup, Credentials & Deployment

## 1. Run locally (no accounts needed)

Requirements: Node.js 20.9+ (22 recommended).

```bash
npm install
npm run dev            # http://localhost:3000
```

With no Supabase variables set, the app uses the **local data backend**. On first request it creates `.data/db.json` containing Theo's sample menu, the fictional demo partners, demo accounts and ~2 weeks of **sample** orders so the dashboards have data. Delete `.data/` (with the server stopped) to reset.

Demo accounts (local backend only; the login page has one-click buttons):

| Role | Email | Password |
|---|---|---|
| Admin | admin@theos.example | Admin#2026demo |
| Theo's staff (restaurant owner) | owner@theos.example | Owner#2026demo |
| Partner restaurant owner | partner@harbourcatch.example | Partner#2026demo |
| Driver | driver@theos.example | Driver#2026demo |
| Customer | customer@theos.example | Customer#2026demo |

These accounts do **not** exist in Supabase mode.

## 2. Quality checks

```bash
npm run typecheck      # TypeScript
npm run lint           # ESLint (next/core-web-vitals + typescript)
npm test               # Vitest: pricing, status machine, zones/hours, full order flow (local backend)
npm run test:e2e       # Playwright: responsive crawl (mobile/tablet/desktop) + ordering flow
```

For `test:e2e`, Playwright starts its own dev server on port 3100 with isolated data (`.data-e2e`). Stop any other `next dev` in this folder first. In environments with a preinstalled Chromium, set `PLAYWRIGHT_CHROMIUM_PATH`.

### Testing the database schema against plain PostgreSQL

```bash
createdb theos_test
psql -d theos_test -c "create extension pgcrypto" \
  -f supabase/tests/supabase_stubs.sql \
  -f supabase/migrations/20260925000000_initial_schema.sql \
  -f supabase/seed.sql -f supabase/seed_demo.sql \
  -f supabase/tests/rls_smoke_test.sql
# → "RLS smoke test passed"
```

The stubs file creates minimal stand-ins for Supabase's `auth` and `storage` schemas.

## 3. Connect Supabase (production data, auth, storage)

1. Create a project at supabase.com. Choose the region closest to Jamaica (e.g. `us-east-1`).
2. Apply the schema, either via the SQL editor (paste the migration) or with the CLI:
   ```bash
   npx supabase link --project-ref <ref>
   npx supabase db push
   ```
3. Load the seed data: run `supabase/seed.sql` in the SQL editor. **Don't** load `seed_demo.sql` in production.
4. Auth → Providers: enable Email. Set the Site URL to your domain and add `https://<domain>/account` to redirect URLs.
5. Set environment variables (below) and redeploy. The app switches to Supabase automatically.
6. Create the first admin: sign up on the site, then in the SQL editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@yourdomain.com';
   ```
7. Link Theo's staff to the restaurant: have them sign up, then run
   ```sql
   insert into public.restaurant_users (restaurant_id, user_id, role)
   select r.id, p.id, 'owner' from public.restaurants r, public.profiles p
   where r.slug = 'theos' and p.email = 'manager@yourdomain.com';
   update public.profiles set role = 'restaurant' where email = 'manager@yourdomain.com';
   ```
8. Storage: the migration creates the public `media` bucket and its policies. Uploads from Partner → Menu/Profile go there automatically.

> The Supabase adapter (`src/lib/db/supabase.ts`) type-checks and the schema has been validated on PostgreSQL 16. The app has **not** yet been run end-to-end against a live Supabase project from this repo. Do a staging pass (sign up, order, dashboards) before launch.

## 4. Environment variables

Copy `.env.example` to `.env.local`.

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Yes (prod) | Canonical URL, used for SEO, tracking links and payment redirects |
| `NEXT_PUBLIC_ANCHOR_RESTAURANT_SLUG` | No | Defaults to `theos` |
| `NEXT_PUBLIC_SUPABASE_URL` | Prod | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Prod | Public anon key (safe in the browser; RLS protects data) |
| `SUPABASE_SERVICE_ROLE_KEY` | Prod | **Secret.** Server-only; never expose it |
| `SUPABASE_STORAGE_BUCKET` | No | Defaults to `media` |
| `DATA_BACKEND` | No | Force `local` or `supabase` |
| `SESSION_SECRET` | Local backend in prod | 32+ random bytes for signing local sessions |
| `SEED_SAMPLE_ORDERS` | No | `false` to start the local store without sample orders |
| `PAYMENTS_ONLINE_PROVIDER` | For online pay | `stripe` (reference) — or a provider you implement (`wipay`, `powertranz`) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | If Stripe | Webhook URL: `https://<domain>/api/v1/payments/stripe/webhook` (events: `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_*`) |
| `RESEND_API_KEY`, `EMAIL_FROM` | For email | Order and contact emails |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_SMS_FROM` | For SMS | Order status SMS |
| `TWILIO_WHATSAPP_FROM` | For WhatsApp | e.g. `whatsapp:+1876…` (approved sender and templates required) |

Admin → Fees & settings shows which integrations are connected.

## 5. Credentials checklist

| Service | Needed for | Status without it |
|---|---|---|
| Supabase project | Persistent data, real auth, image storage | Local JSON store (dev/demo only) |
| Payment acquirer (WiPay / PowerTranz / Stripe via a US entity) | Online card payments | Only cash / card on delivery offered; online option hidden |
| Resend (or another email API) | Receipts and status emails | Attempts logged as `skipped` |
| Twilio SMS | SMS updates | Logged as `skipped` |
| WhatsApp Business sender (via Twilio) | WhatsApp updates | Logged as `skipped` |
| VAPID keys + implementation | Push notifications | Not implemented |
| Domain + DNS | Production URL | — |
| Google Maps/Places API (optional) | Address autocomplete / geocoding | Area picker + optional GPS |

## 6. Deploy (Vercel recommended)

1. Push to GitHub and import the repo in Vercel (framework preset: Next.js).
2. Add the environment variables for Production and Preview. Preview should point at a separate Supabase project or branch.
3. Deploy. Build command `npm run build`; Node 20+.
4. Add the custom domain and set `NEXT_PUBLIC_SITE_URL` to it.
5. Configure payment and email webhooks to the production URL.
6. Submit `https://<domain>/sitemap.xml` in Google Search Console and create or claim the Google Business Profile for Theo's (important for local SEO).

**Do not run production on the local backend:** serverless filesystems are ephemeral. The app logs a warning if `DATA_BACKEND=local` in production.

Multiple instances: the in-memory rate limiter is per instance. Before heavy traffic, move it to Redis/Upstash (`src/lib/rate-limit.ts`).

Self-hosting also works: `npm run build && npm start` behind a reverse proxy with TLS.
