import { describe, expect, it } from "vitest";
import { allowedTransitions, canTransition, timelineFor } from "@/lib/order-status";

describe("order status machine", () => {
  it("restaurant moves pickup orders to completion", () => {
    expect(canTransition("pending", "confirmed", "pickup", "restaurant")).toBe(true);
    expect(canTransition("ready", "delivered", "pickup", "restaurant")).toBe(true);
    expect(canTransition("ready", "out_for_delivery", "pickup", "restaurant")).toBe(false);
  });
  it("delivery orders must go through a driver", () => {
    expect(allowedTransitions("ready", "delivery", "restaurant")).toEqual(["cancelled"]);
    expect(allowedTransitions("ready", "delivery", "driver")).toEqual(["out_for_delivery"]);
    expect(allowedTransitions("out_for_delivery", "delivery", "driver")).toEqual(["delivered"]);
    expect(canTransition("ready", "delivered", "delivery", "admin")).toBe(false);
  });
  it("customers can only cancel pending orders", () => {
    expect(allowedTransitions("pending", "delivery", "customer")).toEqual(["cancelled"]);
    expect(allowedTransitions("confirmed", "delivery", "customer")).toEqual([]);
  });
  it("terminal states have no transitions and orders can't skip steps", () => {
    expect(allowedTransitions("delivered", "pickup", "admin")).toEqual([]);
    expect(allowedTransitions("cancelled", "pickup", "admin")).toEqual([]);
    expect(canTransition("pending", "ready", "pickup", "admin")).toBe(false);
    expect(canTransition("out_for_delivery", "cancelled", "delivery", "admin")).toBe(false);
  });
  it("timelines", () => {
    expect(timelineFor("pickup")).not.toContain("out_for_delivery");
    expect(timelineFor("delivery")).toContain("out_for_delivery");
  });
});
