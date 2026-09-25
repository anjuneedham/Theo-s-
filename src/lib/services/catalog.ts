import "server-only";
import { getDb } from "../db";
import { config } from "../config";
import { isOpenAt, isWithinWindow } from "../hours";
import type {
  DeliveryZone,
  MenuCategory,
  MenuItem,
  Modifier,
  ModifierGroup,
  OperatingHours,
  Restaurant,
  RestaurantCategory,
} from "../types";

export interface MenuItemWithOptions extends MenuItem {
  groups: (ModifierGroup & { modifiers: Modifier[] })[];
}
export interface MenuSection extends MenuCategory {
  items: MenuItemWithOptions[];
  servingNow: boolean;
}

export async function getSettings() {
  const db = getDb();
  const settings = await db.get("platform_settings", "default");
  if (!settings) throw new Error("Platform settings row missing — run the database seed.");
  return settings;
}

export async function getAnchorRestaurant(): Promise<Restaurant> {
  const db = getDb();
  const r = (await db.findOne("restaurants", { slug: config.anchorSlug })) ?? (await db.findOne("restaurants", { is_anchor: true }));
  if (!r) throw new Error("Anchor restaurant not found — run the database seed.");
  return r;
}

export async function getRestaurantBySlug(slug: string, opts: { includeInactive?: boolean } = {}) {
  const r = await getDb().findOne("restaurants", { slug });
  if (!r) return null;
  if (!opts.includeInactive && r.status !== "active") return null;
  return r;
}

export async function getMenu(
  restaurant: Pick<Restaurant, "id" | "timezone">,
  opts: { includeInactive?: boolean } = {},
): Promise<MenuSection[]> {
  const db = getDb();
  const [categories, items, groups, modifiers] = await Promise.all([
    db.list("menu_categories", { restaurant_id: restaurant.id }, { orderBy: "sort_order" }),
    db.list("menu_items", { restaurant_id: restaurant.id }, { orderBy: "sort_order" }),
    db.list("menu_item_modifier_groups", { restaurant_id: restaurant.id }, { orderBy: "sort_order" }),
    db.list("menu_item_modifiers", { restaurant_id: restaurant.id }, { orderBy: "sort_order" }),
  ]);
  const now = new Date();
  return categories
    .filter((c) => opts.includeInactive || c.is_active)
    .map((c) => ({
      ...c,
      servingNow: isWithinWindow(c.available_from, c.available_until, restaurant.timezone, now),
      items: items
        .filter((i) => i.category_id === c.id)
        .map((i) => ({
          ...i,
          groups: groups
            .filter((g) => g.menu_item_id === i.id)
            .map((g) => ({ ...g, modifiers: modifiers.filter((m) => m.group_id === g.id) })),
        })),
    }));
}

export async function getHours(restaurantId: string): Promise<OperatingHours[]> {
  return getDb().list("operating_hours", { restaurant_id: restaurantId }, { orderBy: "day_of_week" });
}

export async function getZones(restaurantId: string, activeOnly = true): Promise<DeliveryZone[]> {
  const zones = await getDb().list("delivery_zones", { restaurant_id: restaurantId }, { orderBy: "sort_order" });
  return activeOnly ? zones.filter((z) => z.is_active) : zones;
}

export async function getUpcomingEvents(restaurantId: string, limit = 6) {
  const events = await getDb().list(
    "restaurant_events",
    { restaurant_id: restaurantId, is_published: true },
    { orderBy: "starts_at" },
  );
  const cutoff = new Date(Date.now() - 6 * 3600000).toISOString();
  return events.filter((e) => e.starts_at >= cutoff).slice(0, limit);
}

export async function getActivePromotions(restaurantId: string | null) {
  const now = new Date().toISOString();
  const promos = await getDb().list("promotions", { is_active: true }, { orderBy: "created_at", ascending: false });
  return promos.filter(
    (p) =>
      (p.restaurant_id === null || p.restaurant_id === restaurantId) &&
      (!p.starts_at || p.starts_at <= now) &&
      (!p.ends_at || p.ends_at >= now) &&
      (p.usage_limit === null || p.used_count < p.usage_limit),
  );
}

export async function getPublishedReviews(restaurantId: string, limit = 6) {
  const reviews = await getDb().list(
    "reviews",
    { restaurant_id: restaurantId, is_published: true },
    { orderBy: "created_at", ascending: false, limit: 50 },
  );
  return reviews.slice(0, limit);
}

export async function getRegions() {
  return getDb().list("regions", { is_active: true }, { orderBy: "sort_order" });
}

export async function getRestaurantCategories() {
  return getDb().list("restaurant_categories", {}, { orderBy: "sort_order" });
}

export interface MarketplaceListing {
  restaurant: Restaurant;
  categories: RestaurantCategory[];
  isOpen: boolean;
  deliveryFromCents: number | null;
  etaMinutes: [number, number] | null;
  areas: string[];
  sponsored: boolean;
}

export async function listMarketplace(filters: { region?: string; category?: string; q?: string; area?: string } = {}) {
  const db = getDb();
  const [restaurants, categories, assignments, hours, zones, regions, placements] = await Promise.all([
    db.list("restaurants", { status: "active" }),
    getRestaurantCategories(),
    db.list("restaurant_category_assignments"),
    db.list("operating_hours"),
    db.list("delivery_zones", { is_active: true }),
    getRegions(),
    db.list("placements", { status: ["active", "scheduled"] }),
  ]);
  const now = new Date();
  const nowIso = now.toISOString();
  const region = filters.region ? regions.find((r) => r.slug === filters.region) : undefined;
  const category = filters.category ? categories.find((c) => c.slug === filters.category) : undefined;
  const q = filters.q?.trim().toLowerCase();
  const area = filters.area?.trim().toLowerCase();

  const listings: MarketplaceListing[] = restaurants.map((r) => {
    const rz = zones.filter((z) => z.restaurant_id === r.id);
    const cats = assignments
      .filter((a) => a.restaurant_id === r.id)
      .map((a) => categories.find((c) => c.id === a.category_id))
      .filter((c): c is RestaurantCategory => Boolean(c));
    return {
      restaurant: r,
      categories: cats,
      isOpen: isOpenAt(
        hours.filter((h) => h.restaurant_id === r.id),
        r.timezone,
        now,
      ),
      deliveryFromCents: r.accepts_delivery && rz.length ? Math.min(...rz.map((z) => z.fee_cents)) : null,
      etaMinutes: rz.length
        ? [Math.min(...rz.map((z) => z.min_minutes)) + r.prep_time_minutes, Math.max(...rz.map((z) => z.max_minutes)) + r.prep_time_minutes]
        : null,
      areas: rz.flatMap((z) => z.areas),
      sponsored: placements.some(
        (p) => p.restaurant_id === r.id && p.type === "sponsored" && p.starts_at <= nowIso && p.ends_at >= nowIso,
      ),
    };
  });

  return listings
    .filter((l) => !region || l.restaurant.region_id === region.id)
    .filter((l) => !category || l.categories.some((c) => c.id === category.id))
    .filter((l) => !area || l.areas.some((a) => a.toLowerCase() === area))
    .filter(
      (l) =>
        !q ||
        l.restaurant.name.toLowerCase().includes(q) ||
        (l.restaurant.tagline ?? "").toLowerCase().includes(q) ||
        l.categories.some((c) => c.name.toLowerCase().includes(q)) ||
        (l.restaurant.city ?? "").toLowerCase().includes(q),
    )
    .sort(
      (a, b) =>
        Number(b.sponsored) - Number(a.sponsored) ||
        Number(b.restaurant.is_anchor) - Number(a.restaurant.is_anchor) ||
        Number(b.restaurant.is_featured) - Number(a.restaurant.is_featured) ||
        Number(b.isOpen) - Number(a.isOpen) ||
        b.restaurant.rating_avg - a.restaurant.rating_avg ||
        a.restaurant.name.localeCompare(b.restaurant.name),
    );
}

/** Items that match a search across the whole network (for "search dishes"). */
export async function searchMenuItems(q: string, limit = 12) {
  const needle = q.trim().toLowerCase();
  if (needle.length < 2) return [];
  const db = getDb();
  const [items, restaurants] = await Promise.all([
    db.list("menu_items", { is_available: true }),
    db.list("restaurants", { status: "active" }),
  ]);
  return items
    .filter((i) => i.name.toLowerCase().includes(needle) || (i.description ?? "").toLowerCase().includes(needle))
    .map((i) => ({ item: i, restaurant: restaurants.find((r) => r.id === i.restaurant_id) }))
    .filter((x): x is { item: MenuItem; restaurant: Restaurant } => Boolean(x.restaurant))
    .slice(0, limit);
}
