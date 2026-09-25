import type {
  DeliveryZone,
  FulfillmentType,
  MenuItem,
  Modifier,
  ModifierGroup,
  OrderItemModifier,
  PlatformSettings,
  Promotion,
  Restaurant,
  SubscriptionPlan,
} from "./types";

/**
 * Pricing & revenue-split engine. Pure functions only — the server calls these
 * with database values so the client can never set its own prices.
 *
 * Revenue model (all rates configurable in Admin → Settings / Restaurants):
 *   customer total      = subtotal − discounts + delivery fee + service fee + tax (if exclusive) + tip
 *   commission          = (subtotal − restaurant-funded food discount) × commission rate
 *   restaurant payout   = subtotal − restaurant-funded discounts − commission + tax (if exclusive)
 *   driver payout       = base payout + delivery fee × driver share   (delivery orders only)
 *   delivery revenue    = delivery fee charged − driver payout         (may be negative)
 *   platform revenue    = commission + service fee − platform-funded discounts + delivery revenue
 * Invariant: total = restaurant payout + platform revenue + driver payout + tip.
 */

export class PricingError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
  }
}

export interface SelectedLine {
  item: MenuItem;
  groups: ModifierGroup[];
  modifiers: Modifier[]; // all modifiers for the item's groups
  selectedModifierIds: string[];
  quantity: number;
}

export interface PricedLine {
  menu_item_id: string;
  name: string;
  unit_price_cents: number;
  quantity: number;
  modifiers: OrderItemModifier[];
  line_total_cents: number;
}

export const MAX_QUANTITY_PER_LINE = 50;

/** Validate modifier selections against group rules and compute the line price. */
export function priceLine(line: SelectedLine): PricedLine {
  const { item, groups, modifiers, selectedModifierIds, quantity } = line;
  if (!item.is_available) throw new PricingError(`${item.name} is currently unavailable`, "item_unavailable");
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_LINE) {
    throw new PricingError(`Invalid quantity for ${item.name}`, "invalid_quantity");
  }
  const selected = new Set(selectedModifierIds);
  const chosen: OrderItemModifier[] = [];
  let unit = item.price_cents;

  const knownIds = new Set(modifiers.map((m) => m.id));
  for (const id of selected) {
    if (!knownIds.has(id)) throw new PricingError(`Invalid option selected for ${item.name}`, "invalid_modifier");
  }

  for (const group of [...groups].sort((a, b) => a.sort_order - b.sort_order)) {
    const options = modifiers.filter((m) => m.group_id === group.id);
    const picked = options.filter((m) => selected.has(m.id));
    if (picked.some((m) => !m.is_available)) {
      throw new PricingError(`An option for ${item.name} is unavailable`, "modifier_unavailable");
    }
    if (picked.length < group.min_select) {
      throw new PricingError(`Please choose ${group.name.toLowerCase()} for ${item.name}`, "modifier_required");
    }
    if (group.max_select > 0 && picked.length > group.max_select) {
      throw new PricingError(`Too many options for ${group.name} on ${item.name}`, "modifier_limit");
    }
    for (const m of picked.sort((a, b) => a.sort_order - b.sort_order)) {
      unit += m.price_delta_cents;
      chosen.push({ group: group.name, name: m.name, price_delta_cents: m.price_delta_cents });
    }
  }

  return {
    menu_item_id: item.id,
    name: item.name,
    unit_price_cents: unit,
    quantity,
    modifiers: chosen,
    line_total_cents: unit * quantity,
  };
}

/** Commission precedence: restaurant override → subscription plan → platform default. */
export function resolveCommissionBps(
  restaurant: Pick<Restaurant, "commission_rate_bps" | "plan_id">,
  plans: SubscriptionPlan[],
  settings: Pick<PlatformSettings, "default_commission_bps">,
): number {
  if (restaurant.commission_rate_bps !== null && restaurant.commission_rate_bps !== undefined) {
    return restaurant.commission_rate_bps;
  }
  const plan = restaurant.plan_id ? plans.find((p) => p.id === restaurant.plan_id) : undefined;
  return plan ? plan.commission_rate_bps : settings.default_commission_bps;
}

export function computeServiceFee(
  subtotalCents: number,
  settings: Pick<PlatformSettings, "service_fee_bps" | "service_fee_min_cents" | "service_fee_max_cents">,
): number {
  if (settings.service_fee_bps <= 0 || subtotalCents <= 0) return 0;
  const raw = Math.round((subtotalCents * settings.service_fee_bps) / 10000);
  const max = settings.service_fee_max_cents > 0 ? settings.service_fee_max_cents : Infinity;
  return Math.min(Math.max(raw, settings.service_fee_min_cents), max);
}

export function computeDriverPayout(
  deliveryFeeCents: number,
  settings: Pick<PlatformSettings, "driver_base_payout_cents" | "driver_fee_share_bps">,
): number {
  return settings.driver_base_payout_cents + Math.round((deliveryFeeCents * settings.driver_fee_share_bps) / 10000);
}

export interface PromotionCheck {
  ok: boolean;
  reason?: string;
}

export function checkPromotion(
  promo: Promotion,
  ctx: { restaurantId: string; subtotalCents: number; fulfillment: FulfillmentType; now: Date },
): PromotionCheck {
  if (!promo.is_active) return { ok: false, reason: "This promotion is not active" };
  if (promo.restaurant_id && promo.restaurant_id !== ctx.restaurantId) {
    return { ok: false, reason: "This code isn't valid for this restaurant" };
  }
  if (promo.starts_at && new Date(promo.starts_at) > ctx.now) return { ok: false, reason: "This promotion hasn't started yet" };
  if (promo.ends_at && new Date(promo.ends_at) < ctx.now) return { ok: false, reason: "This promotion has ended" };
  if (promo.usage_limit !== null && promo.used_count >= promo.usage_limit) {
    return { ok: false, reason: "This promotion has reached its usage limit" };
  }
  if (ctx.subtotalCents < promo.min_subtotal_cents) {
    return { ok: false, reason: "Your order doesn't meet the minimum for this promotion" };
  }
  if (promo.type === "free_delivery" && ctx.fulfillment !== "delivery") {
    return { ok: false, reason: "Free delivery only applies to delivery orders" };
  }
  return { ok: true };
}

export interface TotalsInput {
  lines: Pick<PricedLine, "line_total_cents">[];
  fulfillment: FulfillmentType;
  zone: Pick<DeliveryZone, "fee_cents" | "min_order_cents"> | null;
  restaurant: Pick<Restaurant, "min_order_cents" | "is_anchor">;
  commissionBps: number;
  settings: Pick<
    PlatformSettings,
    | "service_fee_bps"
    | "service_fee_min_cents"
    | "service_fee_max_cents"
    | "tax_rate_bps"
    | "tax_inclusive"
    | "driver_base_payout_cents"
    | "driver_fee_share_bps"
    | "service_fee_on_anchor"
  >;
  promotion?: Promotion | null;
  tipCents?: number;
}

export interface OrderTotals {
  subtotal_cents: number;
  discount_cents: number;
  delivery_fee_cents: number;
  service_fee_cents: number;
  tax_cents: number;
  tip_cents: number;
  total_cents: number;
  commission_rate_bps: number;
  commission_cents: number;
  restaurant_payout_cents: number;
  driver_payout_cents: number;
  delivery_revenue_cents: number;
  platform_revenue_cents: number;
}

export function computeTotals(input: TotalsInput): OrderTotals {
  const { lines, fulfillment, zone, restaurant, commissionBps, settings, promotion } = input;
  const tip = Math.max(0, Math.round(input.tipCents ?? 0));
  const subtotal = lines.reduce((sum, l) => sum + l.line_total_cents, 0);

  if (lines.length === 0) throw new PricingError("Your cart is empty", "empty_cart");
  if (subtotal < restaurant.min_order_cents) {
    throw new PricingError("Your order is below the restaurant's minimum", "below_minimum");
  }
  if (fulfillment === "delivery") {
    if (!zone) throw new PricingError("We don't deliver to that area yet", "no_zone");
    if (subtotal < zone.min_order_cents) {
      throw new PricingError("Your order is below the minimum for delivery to this area", "below_zone_minimum");
    }
  }

  const deliveryFee = fulfillment === "delivery" && zone ? zone.fee_cents : 0;

  // Discounts
  let foodDiscount = 0;
  let deliveryDiscount = 0;
  if (promotion) {
    if (promotion.type === "percent") foodDiscount = Math.round((subtotal * promotion.value) / 10000);
    else if (promotion.type === "fixed") foodDiscount = Math.min(promotion.value, subtotal);
    else if (promotion.type === "free_delivery") deliveryDiscount = deliveryFee;
  }
  foodDiscount = Math.min(foodDiscount, subtotal);
  const discount = foodDiscount + deliveryDiscount;
  const restaurantFunded = promotion?.funded_by === "restaurant";

  const applyServiceFee = !restaurant.is_anchor || settings.service_fee_on_anchor;
  const serviceFee = applyServiceFee ? computeServiceFee(subtotal, settings) : 0;

  const taxableFood = subtotal - foodDiscount;
  let tax = 0;
  if (settings.tax_rate_bps > 0) {
    tax = settings.tax_inclusive
      ? Math.round(taxableFood - taxableFood / (1 + settings.tax_rate_bps / 10000))
      : Math.round((taxableFood * settings.tax_rate_bps) / 10000);
  }
  const taxAdded = settings.tax_inclusive ? 0 : tax;

  const total = subtotal - discount + deliveryFee + serviceFee + taxAdded + tip;

  const commissionBase = subtotal - (restaurantFunded ? foodDiscount : 0);
  const commission = Math.round((commissionBase * commissionBps) / 10000);
  const restaurantPayout =
    subtotal - (restaurantFunded ? foodDiscount + deliveryDiscount : 0) - commission + taxAdded;

  const driverPayout = fulfillment === "delivery" ? computeDriverPayout(deliveryFee, settings) : 0;
  const deliveryRevenue = fulfillment === "delivery" ? deliveryFee - driverPayout : 0;
  const platformRevenue =
    commission + serviceFee - (restaurantFunded ? 0 : foodDiscount + deliveryDiscount) + deliveryRevenue;

  return {
    subtotal_cents: subtotal,
    discount_cents: discount,
    delivery_fee_cents: deliveryFee,
    service_fee_cents: serviceFee,
    tax_cents: tax,
    tip_cents: tip,
    total_cents: total,
    commission_rate_bps: commissionBps,
    commission_cents: commission,
    restaurant_payout_cents: restaurantPayout,
    driver_payout_cents: driverPayout,
    delivery_revenue_cents: deliveryRevenue,
    platform_revenue_cents: platformRevenue,
  };
}
