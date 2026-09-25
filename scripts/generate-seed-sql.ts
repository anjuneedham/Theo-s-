/**
 * Generates supabase/seed.sql (Theo's + configuration) and supabase/seed_demo.sql
 * (fictional partner restaurants) from the same source as the local dev store,
 * so both backends start with identical data.
 *
 *   npm run db:seed-sql
 */
import { writeFileSync } from "node:fs";
import { buildSeed } from "../src/lib/db/seed";
import type { TableName } from "../src/lib/types";

const data = buildSeed({ sampleOrders: false, now: new Date("2026-01-01T12:00:00Z") });
const THEOS_ID = data.restaurants!.find((r) => r.slug === "theos")!.id;

function literal(v: unknown): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  if (Array.isArray(v)) return `array[${v.map(literal).join(", ")}]::text[]`.replace("array[]::text[]", "'{}'::text[]");
  if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

function inserts(table: TableName, rows: object[]): string {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const values = rows.map((r) => `  (${cols.map((c) => literal((r as Record<string, unknown>)[c])).join(", ")})`).join(",\n");
  return `insert into public.${table} (${cols.join(", ")}) values\n${values}\non conflict (id) do nothing;\n\n`;
}

const restaurantTables: TableName[] = [
  "restaurant_category_assignments",
  "operating_hours",
  "menu_categories",
  "menu_items",
  "menu_item_modifier_groups",
  "menu_item_modifiers",
  "delivery_zones",
  "promotions",
];

function build(isDemo: boolean) {
  const keep = (r: { restaurant_id?: string | null }) => (isDemo ? r.restaurant_id !== THEOS_ID : r.restaurant_id === THEOS_ID);
  let sql = isDemo
    ? "-- FICTIONAL demo partner restaurants for trying the marketplace. Do not load in production.\n\n"
    : "-- Theo's Restaurant & Lounge + platform configuration. SAMPLE content: replace menu, prices,\n-- hours and contact details with real information (all editable in the dashboards).\n\n";
  if (!isDemo) {
    sql += inserts("platform_settings", data.platform_settings!);
    sql += inserts("regions", data.regions!);
    sql += inserts("restaurant_categories", data.restaurant_categories!);
    sql += inserts("subscription_plans", data.subscription_plans!);
  }
  sql += inserts("restaurants", data.restaurants!.filter((r) => (isDemo ? r.id !== THEOS_ID : r.id === THEOS_ID)));
  for (const t of restaurantTables) sql += inserts(t, (data[t] as { restaurant_id?: string | null }[]).filter(keep) as object[]);
  if (!isDemo) {
    sql += `-- Sample lounge events, scheduled relative to when the seed runs.
insert into public.restaurant_events (restaurant_id, title, description, starts_at, is_published) values
  ('${THEOS_ID}', 'Friday Night Lounge', 'Selector on the decks from 9pm, rum punch specials all night. Smart casual.', date_trunc('week', now()) + interval '4 days 26 hours', true),
  ('${THEOS_ID}', 'Sunday Brunch & Live Acoustic', 'Brunch platters, sorrel mimosas and a live acoustic set from noon.', date_trunc('week', now()) + interval '6 days 16 hours', true),
  ('${THEOS_ID}', 'Wednesday Dominoes Night', 'Bring your crew. Winners'' table gets a round on the house.', date_trunc('week', now()) + interval '2 days 24 hours', true);
`;
  }
  return sql;
}

writeFileSync("supabase/seed.sql", build(false));
writeFileSync("supabase/seed_demo.sql", build(true));
console.log("Wrote supabase/seed.sql and supabase/seed_demo.sql");
