import { describe, expect, it } from "vitest";
import { resolveZone, haversineKm, normalizeArea } from "@/lib/zones";
import { isOpenAt, isWithinWindow } from "@/lib/hours";
import type { DeliveryZone, OperatingHours } from "@/lib/types";

const z = (id: string, areas: string[], radius: number | null, sort: number, active = true): DeliveryZone => ({
  id, restaurant_id: "r", name: id, description: null, fee_cents: 0, min_minutes: 0, max_minutes: 0, areas, radius_km: radius, min_order_cents: 0, is_active: active, sort_order: sort,
});
const zones = [z("A", ["New Kingston", "Half Way Tree"], 4, 1), z("B", ["Papine"], 8, 2), z("X", ["Portmore"], 20, 3, false)];
const origin = { latitude: 18.0179, longitude: -76.8099 };

describe("zones", () => {
  it("matches areas case-insensitively", () => {
    expect(resolveZone(zones, { area: " half way  tree " }, origin)?.id).toBe("A");
    expect(normalizeArea("St. Andrew")).toBe("st andrew");
  });
  it("ignores inactive zones", () => {
    expect(resolveZone(zones, { area: "Portmore" }, origin)).toBeNull();
  });
  it("falls back to the smallest containing radius", () => {
    expect(resolveZone(zones, { latitude: 18.03, longitude: -76.8 }, origin)?.id).toBe("A");
    expect(resolveZone(zones, { latitude: 18.07, longitude: -76.78 }, origin)?.id).toBe("B");
    expect(resolveZone(zones, { latitude: 18.47, longitude: -77.9 }, origin)).toBeNull();
  });
  it("haversine sanity", () => {
    expect(Math.round(haversineKm({ lat: 18.0179, lng: -76.8099 }, { lat: 18.4762, lng: -77.8939 }))).toBeGreaterThan(110);
  });
});

const hours: OperatingHours[] = [0, 1, 2, 3, 4, 5, 6].map((d) => ({
  id: String(d), restaurant_id: "r", day_of_week: d,
  opens_at: d === 5 ? "11:00" : "11:00", closes_at: d === 5 ? "02:00" : "22:00", is_closed: d === 1,
}));
// Jamaica = UTC−5. 2026-09-25 is a Friday.
const at = (iso: string) => new Date(iso);

describe("hours", () => {
  it("open during the day, closed early morning", () => {
    expect(isOpenAt(hours, "America/Jamaica", at("2026-09-25T17:00:00Z"))).toBe(true); // Fri 12:00
    expect(isOpenAt(hours, "America/Jamaica", at("2026-09-25T14:00:00Z"))).toBe(false); // Fri 09:00
  });
  it("handles closing after midnight", () => {
    expect(isOpenAt(hours, "America/Jamaica", at("2026-09-26T06:30:00Z"))).toBe(true); // Sat 01:30 (Friday session)
    expect(isOpenAt(hours, "America/Jamaica", at("2026-09-26T07:30:00Z"))).toBe(false); // Sat 02:30
  });
  it("respects closed days", () => {
    expect(isOpenAt(hours, "America/Jamaica", at("2026-09-28T17:00:00Z"))).toBe(false); // Monday
  });
  it("category windows", () => {
    expect(isWithinWindow("07:00", "11:30", "America/Jamaica", at("2026-09-25T13:00:00Z"))).toBe(true); // 08:00
    expect(isWithinWindow("07:00", "11:30", "America/Jamaica", at("2026-09-25T18:00:00Z"))).toBe(false); // 13:00
    expect(isWithinWindow(null, null, "America/Jamaica")).toBe(true);
  });
});
