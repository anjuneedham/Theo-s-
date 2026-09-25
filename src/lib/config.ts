/**
 * Server-side configuration. Secrets are read from environment variables only
 * and never imported into client components (see `import "server-only"` users).
 */
export type DataBackend = "local" | "supabase";

function bool(v: string | undefined, fallback: boolean): boolean {
  if (v === undefined || v === "") return fallback;
  return v === "1" || v.toLowerCase() === "true";
}

const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// Vercel sets VERCEL_URL (host only, no scheme) on every deployment; fall back
// to it so preview/demo deployments get a correct absolute site URL without
// each one needing NEXT_PUBLIC_SITE_URL set by hand.
const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL ?? process.env.VERCEL_URL;

export const config = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? (vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000"),
  anchorSlug: process.env.NEXT_PUBLIC_ANCHOR_RESTAURANT_SLUG ?? "theos",
  dataBackend: ((process.env.DATA_BACKEND as DataBackend | undefined) ?? (supabaseConfigured ? "supabase" : "local")) as DataBackend,
  supabaseConfigured,
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    storageBucket: process.env.SUPABASE_STORAGE_BUCKET ?? "media",
  },
  // On Vercel the deployment bundle is read-only; only /tmp is writable
  // (ephemeral per instance, but fine for a demo deployment on the local backend).
  localDataDir: process.env.LOCAL_DATA_DIR ?? (process.env.VERCEL ? "/tmp/theos-data" : ".data"),
  seedSampleOrders: bool(process.env.SEED_SAMPLE_ORDERS, true),
  sessionSecret: process.env.SESSION_SECRET ?? "",
  isProduction: process.env.NODE_ENV === "production",
};

export function assertProductionSafety() {
  if (config.isProduction && config.dataBackend === "local" && !bool(process.env.ALLOW_LOCAL_BACKEND_IN_PRODUCTION, false)) {
    // Local JSON storage is for development and demos only.
    console.warn(
      "[theos] DATA_BACKEND=local in production. Data will not persist across deploys. Configure Supabase (see SETUP.md).",
    );
  }
}
