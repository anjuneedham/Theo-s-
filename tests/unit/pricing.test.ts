import { describe, expect, it } from "vitest";
import { computeTotals, priceLine, resolveCommissionBps, computeServiceFee, checkPromotion, PricingError } from "@/lib/pricing";
import type { MenuItem, Modifier, ModifierGroup, PlatformSettings, Promotion } from "@/lib/types";

const settings: PlatformSettings = {
  id: "default",
  platform_name: "Test",
  currency: "JMD",
  default_commission_bps: 1500,
  service_fee_bps: 500,
  service_fee_min_cents: 10000,
  service_fee_max_cents: 60000,
  service_fee_on_anchor: false,
  tax_rate_bps: 1500,
  tax_inclusive: true,
  driver_base_payout_cents: 25000,
  driver_fee_share_bps: 6000,
  payment_methods: ["cash"],
  allow_guest_checkout: true,
  support_email: "x@example.com",
  support_phone: "1",
  updated_at: "",
};

const item: MenuItem = {
  id: "i1", restaurant_id: "r1", category_id: "c1", name: "Jerk Chicken", description: null, price_cents: 195000,
  image_url: null, is_available: true, is_featured: false, dietary_tags: [], spice_level: 2, sort_order: 0, created_at: "",
};
const groups: ModifierGroup[] = [
  { id: "g-side", restaurant_id: "r1", menu_item_id: "i1", name: "Choose your side", min_select: 1, max_select: 1, sort_order: 0 },
  { id: "g-add", restaurant_id: "r1", menu_item_id: "i1", name: "Add-ons", min_select: 0, max_select: 2, sort_order: 1 },
];
const mod = (id: string, group_id: string, cents: number, extra: Partial<Modifier> = {}): Modifier => ({
  id, restaurant_id: "r1", group_id, name: id, price_delta_cents: cents, is_available: true, is_default: false, sort_order: 0, ...extra,
});
const modifiers = [mod("rice", "g-side", 0), mod("breadfruit", "g-side", 15000), mod("festival", "g-add", 30000), mod("veg", "g-add", 35000), mod("plantain", "g-add", 40000)];

describe("priceLine", () => {
  it("adds modifier prices and multiplies by quantity", () => {
    const line = priceLine({ item, groups, modifiers, selectedModifierIds: ["breadfruit", "festival", "veg"], quantity: 2 });
    expect(line.unit_price_cents).toBe(195000 + 15000 + 30000 + 35000);
    expect(line.line_total_cents).toBe(line.unit_price_cents * 2);
    expect(line.modifiers.map((m) => m.group)).toEqual(["Choose your side", "Add-ons", "Add-ons"]);
  });
  it("enforces required groups", () => {
    expect(() => priceLine({ item, groups, modifiers, selectedModifierIds: [], quantity: 1 })).toThrow(PricingError);
  });
  it("enforces max selections", () => {
    expect(() => priceLine({ item, groups, modifiers, selectedModifierIds: ["rice", "festival", "veg", "plantain"], quantity: 1 })).toThrow(/Too many/);
  });
  it("rejects modifiers from another item", () => {
    expect(() => priceLine({ item, groups, modifiers, selectedModifierIds: ["rice", "hacked"], quantity: 1 })).toThrow(/Invalid option/);
  });
  it("rejects unavailable items and bad quantities", () => {
    expect(() => priceLine({ item: { ...item, is_available: false }, groups, modifiers, selectedModifierIds: ["rice"], quantity: 1 })).toThrow(/unavailable/);
    expect(() => priceLine({ item, groups, modifiers, selectedModifierIds: ["rice"], quantity: 0 })).toThrow(/quantity/);
  });
});

describe("commission & fees", () => {
  it("uses restaurant override, then plan, then default", () => {
    const plans = [{ id: "p1", commission_rate_bps: 1000 }] as never;
    expect(resolveCommissionBps({ commission_rate_bps: 0, plan_id: "p1" }, plans, settings)).toBe(0);
    expect(resolveCommissionBps({ commission_rate_bps: null, plan_id: "p1" }, plans, settings)).toBe(1000);
    expect(resolveCommissionBps({ commission_rate_bps: null, plan_id: null }, plans, settings)).toBe(1500);
  });
  it("clamps the service fee", () => {
    expect(computeServiceFee(50000, settings)).toBe(10000); // 5% = 2,500 → min 10,000
    expect(computeServiceFee(2_000_000, settings)).toBe(60000); // 5% = 100,000 → max 60,000
    expect(computeServiceFee(400000, settings)).toBe(20000);
  });
});

const lines = [{ line_total_cents: 400000 }];
const partner = { min_order_cents: 0, is_anchor: false };
const zone = { fee_cents: 70000, min_order_cents: 0 };

describe("computeTotals", () => {
  it("balances: total = payout + platform + driver + tip (partner delivery)", () => {
    const t = computeTotals({ lines, fulfillment: "delivery", zone, restaurant: partner, commissionBps: 1500, settings, tipCents: 20000 });
    expect(t.delivery_fee_cents).toBe(70000);
    expect(t.service_fee_cents).toBe(20000);
    expect(t.commission_cents).toBe(60000);
    expect(t.total_cents).toBe(400000 + 70000 + 20000 + 20000);
    expect(t.restaurant_payout_cents + t.platform_revenue_cents + t.driver_payout_cents + t.tip_cents).toBe(t.total_cents);
  });

  it("anchor pickup: no service fee, no commission, Theo's keeps food revenue", () => {
    const t = computeTotals({ lines, fulfillment: "pickup", zone: null, restaurant: { min_order_cents: 0, is_anchor: true }, commissionBps: 0, settings });
    expect(t.service_fee_cents).toBe(0);
    expect(t.total_cents).toBe(400000);
    expect(t.restaurant_payout_cents).toBe(400000);
    expect(t.platform_revenue_cents).toBe(0);
  });

  it("reports inclusive tax without adding it; adds exclusive tax", () => {
    const inc = computeTotals({ lines, fulfillment: "pickup", zone: null, restaurant: partner, commissionBps: 0, settings });
    expect(inc.tax_cents).toBe(Math.round(400000 - 400000 / 1.15));
    expect(inc.total_cents).toBe(400000 + inc.service_fee_cents);
    const exc = computeTotals({ lines, fulfillment: "pickup", zone: null, restaurant: partner, commissionBps: 0, settings: { ...settings, tax_inclusive: false } });
    expect(exc.tax_cents).toBe(60000);
    expect(exc.total_cents).toBe(400000 + 60000 + exc.service_fee_cents);
    expect(exc.restaurant_payout_cents + exc.platform_revenue_cents).toBe(exc.total_cents);
  });

  const promo = (p: Partial<Promotion>): Promotion => ({
    id: "p", restaurant_id: null, code: "X", title: "", description: null, type: "percent", value: 1000, min_subtotal_cents: 0,
    funded_by: "platform", starts_at: null, ends_at: null, usage_limit: null, used_count: 0, is_active: true, created_at: "", ...p,
  });

  it("platform-funded discounts reduce platform revenue, not payout", () => {
    const t = computeTotals({ lines, fulfillment: "delivery", zone, restaurant: partner, commissionBps: 1500, settings, promotion: promo({}) });
    expect(t.discount_cents).toBe(40000);
    expect(t.commission_cents).toBe(60000);
    expect(t.restaurant_payout_cents).toBe(400000 - 60000);
    expect(t.restaurant_payout_cents + t.platform_revenue_cents + t.driver_payout_cents).toBe(t.total_cents);
  });

  it("restaurant-funded discounts reduce payout and the commission base", () => {
    const t = computeTotals({ lines, fulfillment: "delivery", zone, restaurant: partner, commissionBps: 1500, settings, promotion: promo({ funded_by: "restaurant" }) });
    expect(t.commission_cents).toBe(Math.round(360000 * 0.15));
    expect(t.restaurant_payout_cents).toBe(360000 - t.commission_cents);
    expect(t.restaurant_payout_cents + t.platform_revenue_cents + t.driver_payout_cents).toBe(t.total_cents);
  });

  it("free delivery waives the delivery fee and still balances", () => {
    const t = computeTotals({ lines, fulfillment: "delivery", zone, restaurant: partner, commissionBps: 1500, settings, promotion: promo({ type: "free_delivery", value: 0, funded_by: "restaurant" }) });
    expect(t.discount_cents).toBe(70000);
    expect(t.total_cents).toBe(400000 + t.service_fee_cents);
    expect(t.restaurant_payout_cents + t.platform_revenue_cents + t.driver_payout_cents).toBe(t.total_cents);
  });

  it("requires a zone for delivery and enforces minimums", () => {
    expect(() => computeTotals({ lines, fulfillment: "delivery", zone: null, restaurant: partner, commissionBps: 0, settings })).toThrow(/deliver/);
    expect(() => computeTotals({ lines, fulfillment: "delivery", zone: { fee_cents: 0, min_order_cents: 500000 }, restaurant: partner, commissionBps: 0, settings })).toThrow(/minimum/);
    expect(() => computeTotals({ lines: [], fulfillment: "pickup", zone: null, restaurant: partner, commissionBps: 0, settings })).toThrow(/empty/);
  });

  it("validates promotions", () => {
    const now = new Date("2026-06-01T12:00:00Z");
    const ctx = { restaurantId: "r1", subtotalCents: 100000, fulfillment: "pickup" as const, now };
    expect(checkPromotion(promo({}), ctx).ok).toBe(true);
    expect(checkPromotion(promo({ restaurant_id: "other" }), ctx).ok).toBe(false);
    expect(checkPromotion(promo({ ends_at: "2026-05-01T00:00:00Z" }), ctx).ok).toBe(false);
    expect(checkPromotion(promo({ usage_limit: 5, used_count: 5 }), ctx).ok).toBe(false);
    expect(checkPromotion(promo({ min_subtotal_cents: 200000 }), ctx).ok).toBe(false);
    expect(checkPromotion(promo({ type: "free_delivery" }), ctx).ok).toBe(false);
  });
});
