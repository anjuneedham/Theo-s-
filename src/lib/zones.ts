import type { DeliveryZone } from "./types";

export function normalizeArea(area: string): string {
  return area.trim().toLowerCase().replace(/\s+/g, " ").replace(/[.’']/g, "");
}

/** Great-circle distance in kilometres. */
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export interface ZoneQuery {
  area?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/**
 * Find the delivery zone for a customer location. Zones are configured per
 * restaurant, so nothing here assumes a particular city:
 *  1. an exact (case-insensitive) match on the zone's listed areas wins;
 *  2. otherwise, with GPS coordinates, the smallest radius zone that contains the point.
 */
export function resolveZone(
  zones: DeliveryZone[],
  query: ZoneQuery,
  origin: { latitude: number | null; longitude: number | null },
): DeliveryZone | null {
  const active = zones.filter((z) => z.is_active).sort((a, b) => a.sort_order - b.sort_order);
  if (query.area) {
    const needle = normalizeArea(query.area);
    const match = active.find((z) => z.areas.some((a) => normalizeArea(a) === needle));
    if (match) return match;
  }
  if (
    query.latitude != null &&
    query.longitude != null &&
    origin.latitude != null &&
    origin.longitude != null
  ) {
    const distance = haversineKm(
      { lat: origin.latitude, lng: origin.longitude },
      { lat: query.latitude, lng: query.longitude },
    );
    const byRadius = active
      .filter((z) => z.radius_km != null && distance <= z.radius_km)
      .sort((a, b) => (a.radius_km ?? 0) - (b.radius_km ?? 0));
    if (byRadius[0]) return byRadius[0];
  }
  return null;
}

/** All areas served by a restaurant, for the "choose your area" picker (minimal typing). */
export function servedAreas(zones: DeliveryZone[]): { area: string; zoneId: string }[] {
  return zones
    .filter((z) => z.is_active)
    .flatMap((z) => z.areas.map((area) => ({ area, zoneId: z.id })))
    .sort((a, b) => a.area.localeCompare(b.area));
}
