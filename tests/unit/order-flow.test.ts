import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetLocalStoreForTests } from "@/lib/db/local";
import { getDb } from "@/lib/db";
import { placeOrder, quoteOrder, updateOrderStatus, getOrderForViewer } from "@/lib/services/orders";
import { acceptDelivery, pickUpDelivery, completeDelivery, driverBoard } from "@/lib/services/drivers";
import { generatePayouts } from "@/lib/services/admin";
import { createReview } from "@/lib/services/customers";
import { stableId } from "@/lib/ids";
import type { SessionUser } from "@/lib/auth/session";
import type { PlaceOrderInput } from "@/lib/validation";

const THEOS = stableId("restaurant:theos");
const HARBOUR = stableId("restaurant:harbour-catch");
const jerk = stableId("item:theos:main-courses:Jerk Chicken");
const jerkGroup = (name: string) => stableId(`mgroup:${jerk}:${name}`);
const jerkMod = (group: string, name: string) => stableId(`mod:${jerkGroup(group)}:${name}`);
const fish = stableId("item:harbour-catch:fish:Fried Fish & Bammy");
const fishSide = stableId(`mod:${stableId(`mgroup:${fish}:Choose your side`)}:Rice & Peas`);
const breakfast = stableId("item:theos:breakfast:Ackee & Saltfish");

const customer: SessionUser = { id: stableId("user:customer@theos.example"), email: "customer@theos.example", full_name: "Keisha Brown", phone: null, role: "customer" };
const owner: SessionUser = { id: stableId("user:owner@theos.example"), email: "owner@theos.example", full_name: "Owner", phone: null, role: "restaurant" };
const harbourOwner: SessionUser = { id: stableId("user:partner@harbourcatch.example"), email: "partner@harbourcatch.example", full_name: "P", phone: null, role: "restaurant" };
const driver: SessionUser = { id: stableId("user:driver@theos.example"), email: "driver@theos.example", full_name: "Andre", phone: null, role: "driver" };

const jerkLine = {
  menu_item_id: jerk,
  quantity: 2,
  modifier_ids: [jerkMod("Portion", "Quarter"), jerkMod("Heat level", "Regular"), jerkMod("Choose your side", "Rice & Peas"), jerkMod("Add-ons", "Extra Festival")],
  special_instructions: "Extra sauce",
};

function input(over: Partial<PlaceOrderInput> = {}): PlaceOrderInput {
  return {
    restaurant_id: THEOS,
    fulfillment_type: "delivery",
    items: [jerkLine],
    area: null,
    latitude: null,
    longitude: null,
    promo_code: null,
    tip_cents: 0,
    contact_name: "Keisha Brown",
    contact_phone: "876-555-0199",
    contact_email: "keisha@example.com",
    address: { label: "Home", line1: "14 Sample Ave", line2: null, area: "Liguanea", city: "Kingston", parish: "St. Andrew", instructions: null },
    save_address: false,
    notes: null,
    payment_method: "cash",
    scheduled_for: null,
    idempotency_key: null,
    ...over,
  };
}

beforeEach(() => {
  resetLocalStoreForTests();
  // Friday 13:00 in Jamaica — Theo's is open and lunch is served, breakfast isn't.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-09-25T18:00:00Z"));
});

describe("ordering", () => {
  it("quotes from database prices, not client input", async () => {
    const q = await quoteOrder({ ...input(), area: "Liguanea" });
    // (1,950 + 300 extra festival) × 2 = 4,500
    expect(q.totals.subtotal_cents).toBe(450000);
    expect(q.totals.delivery_fee_cents).toBe(40000); // Zone A
    expect(q.totals.service_fee_cents).toBe(0); // direct Theo's order
    expect(q.zone?.name).toBe("Zone A");
  });

  it("places a delivery order and runs it through restaurant + driver to delivered", async () => {
    const { order } = await placeOrder(input(), customer);
    expect(order.status).toBe("pending");
    expect(order.payment_status).toBe("pending");
    expect(order.total_cents).toBe(450000 + 40000);

    await updateOrderStatus(order.id, "confirmed", owner);
    await updateOrderStatus(order.id, "preparing", owner);
    await updateOrderStatus(order.id, "ready", owner);
    await expect(updateOrderStatus(order.id, "delivered", owner)).rejects.toThrow(/Can't change/);

    const board = await driverBoard(driver);
    const job = board.available.find((a) => a.order.id === order.id);
    expect(job).toBeTruthy();
    expect(JSON.stringify(job)).not.toContain("555-0199"); // no customer phone before accepting
    await acceptDelivery(driver, job!.delivery.id);
    await pickUpDelivery(driver, job!.delivery.id);
    const done = await completeDelivery(driver, job!.delivery.id);
    expect(done.status).toBe("delivered");
    expect(done.payment_status).toBe("paid"); // cash collected at handover

    const db = getDb();
    const history = await db.list("order_status_history", { order_id: order.id });
    expect(history.map((h) => h.status)).toEqual(["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered"]);
    const notes = await db.list("notifications", { order_id: order.id });
    expect(notes.some((n) => n.channel === "in_app" && n.status === "sent")).toBe(true);
    expect(notes.filter((n) => n.channel === "sms").every((n) => n.status === "skipped")).toBe(true); // no Twilio creds

    const review = await createReview(customer, { order_id: order.id, rating: 5, comment: "Great" });
    expect(review.author_name).toBe("Keisha B.");
    expect((await db.get("restaurants", THEOS))?.rating_count).toBe(1);
  });

  it("rejects areas outside delivery zones and items outside their serving window", async () => {
    await expect(placeOrder(input({ address: { line1: "1 Road", area: "Negril", label: null, line2: null, city: null, parish: null, instructions: null } }), customer)).rejects.toThrow(/deliver/);
    await expect(placeOrder(input({ items: [{ menu_item_id: breakfast, quantity: 1, modifier_ids: [], special_instructions: null }] }), customer)).rejects.toThrow(/only served/);
  });

  it("refuses online payment when no provider is configured (never fakes success)", async () => {
    await expect(placeOrder(input({ payment_method: "online" }), customer)).rejects.toThrow(/payment method/);
  });

  it("applies promo codes and restricts guests to their tracking token", async () => {
    const { order } = await placeOrder(input({ promo_code: "welcome10" }), null);
    expect(order.discount_cents).toBe(45000);
    expect(order.customer_id).toBeNull();
    expect(await getOrderForViewer(order.id, { user: null, token: "wrong" })).toBeNull();
    expect(await getOrderForViewer(order.id, { user: harbourOwner })).toBeNull();
    const view = await getOrderForViewer(order.id, { user: null, token: order.tracking_token });
    expect(view?.detail.items).toHaveLength(1);
    // Guest can cancel while pending, via the token
    const cancelled = await updateOrderStatus(order.id, "cancelled", null, { token: order.tracking_token });
    expect(cancelled.status).toBe("cancelled");
  });

  it("is idempotent for retried submissions", async () => {
    const a = await placeOrder(input({ idempotency_key: "abc-123" }), customer);
    const b = await placeOrder(input({ idempotency_key: "abc-123" }), customer);
    expect(b.order.id).toBe(a.order.id);
  });

  it("charges commission + service fee on partner orders and settles payouts", async () => {
    const { order } = await placeOrder(
      input({ restaurant_id: HARBOUR, items: [{ menu_item_id: fish, quantity: 1, modifier_ids: [fishSide], special_instructions: null }], fulfillment_type: "pickup", address: null }),
      customer,
    );
    expect(order.commission_rate_bps).toBe(1400); // Growth plan
    expect(order.service_fee_cents).toBeGreaterThan(0);
    await expect(updateOrderStatus(order.id, "confirmed", owner)).rejects.toThrow(/permission/);
    for (const s of ["confirmed", "preparing", "ready", "delivered"] as const) await updateOrderStatus(order.id, s, harbourOwner);
    const payouts = await generatePayouts(new Date(Date.now() + 60000).toISOString());
    const p = payouts.find((x) => x.restaurant_id === HARBOUR)!;
    // Customer paid cash at pickup → restaurant holds the money and owes the platform its share.
    expect(p.amount_cents).toBe(-(order.total_cents - order.restaurant_payout_cents));
    expect((await getDb().get("orders", order.id))?.payout_id).toBe(p.id);
  });
});
