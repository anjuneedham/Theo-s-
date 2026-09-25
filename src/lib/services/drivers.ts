import "server-only";
import type { z } from "zod";
import { getDb } from "../db";
import { newId } from "../ids";
import type { SessionUser } from "../auth/session";
import type { driverApplicationSchema } from "../validation";
import type { DriverStatus } from "../types";
import { OrderError, updateOrderStatus } from "./orders";
import { ForbiddenError } from "../auth/guards";

export async function getDriverForUser(userId: string) {
  return getDb().findOne("drivers", { user_id: userId });
}

async function requireDriver(user: SessionUser) {
  const driver = await getDriverForUser(user.id);
  if (!driver) throw new ForbiddenError("No driver profile for this account");
  if (!driver.is_approved) throw new ForbiddenError("Your driver account is awaiting approval");
  return driver;
}

/**
 * Driver board. Available jobs show only the pickup restaurant, destination area
 * and payout — the customer's name, phone and full address are revealed once the
 * driver accepts the job.
 */
export async function driverBoard(user: SessionUser) {
  const db = getDb();
  const driver = await getDriverForUser(user.id);
  if (!driver) return { driver: null, available: [], mine: [], completedToday: [] };
  const [unassigned, mineRows] = await Promise.all([
    db.list("deliveries", { status: "unassigned", driver_id: null }, { orderBy: "created_at" }),
    db.list("deliveries", { driver_id: driver.id }, { orderBy: "created_at", ascending: false, limit: 50 }),
  ]);
  const orderIds = [...unassigned, ...mineRows].map((d) => d.order_id);
  const orders = orderIds.length ? await db.list("orders", { id: orderIds }) : [];
  const restaurants = orders.length ? await db.list("restaurants", { id: [...new Set(orders.map((o) => o.restaurant_id))] }) : [];
  const withOrder = (d: (typeof unassigned)[number]) => {
    const order = orders.find((o) => o.id === d.order_id)!;
    return { delivery: d, order, restaurant: restaurants.find((r) => r.id === order?.restaurant_id) ?? null };
  };
  const available = unassigned
    .map(withOrder)
    .filter((x) => x.order && ["confirmed", "preparing", "ready"].includes(x.order.status))
    .filter((x) => !driver.region_id || !x.restaurant?.region_id || x.restaurant.region_id === driver.region_id)
    .map((x) => ({
      delivery: x.delivery,
      restaurant: x.restaurant ? { name: x.restaurant.name, city: x.restaurant.city, address_line: x.restaurant.address_line } : null,
      order: { id: x.order.id, order_number: x.order.order_number, status: x.order.status, area: x.order.delivery_address?.area ?? null, estimated_ready_at: x.order.estimated_ready_at },
    }));
  const since = new Date(Date.now() - 24 * 3600000).toISOString();
  const mine = mineRows.filter((d) => ["assigned", "picked_up"].includes(d.status)).map(withOrder);
  const completedToday = mineRows.filter((d) => d.status === "delivered" && (d.delivered_at ?? "") >= since).map(withOrder);
  return { driver, available, mine, completedToday };
}

export async function acceptDelivery(user: SessionUser, deliveryId: string) {
  const db = getDb();
  const driver = await requireDriver(user);
  const delivery = await db.get("deliveries", deliveryId);
  if (!delivery) throw new OrderError("Delivery not found", 404);
  if (delivery.driver_id || delivery.status !== "unassigned") throw new OrderError("Another driver already accepted this delivery", 409);
  const active = await db.count("deliveries", { driver_id: driver.id, status: ["assigned", "picked_up"] });
  if (active >= 3) throw new OrderError("Finish your current deliveries first (max 3 at a time)", 409);
  // Compare-and-set so two drivers tapping "Accept" at once can't both get the job.
  const updated = await db.updateIf(
    "deliveries",
    deliveryId,
    { driver_id: null, status: "unassigned" },
    { driver_id: driver.id, status: "assigned", assigned_at: new Date().toISOString() },
  );
  if (!updated) throw new OrderError("Another driver already accepted this delivery", 409);
  await db.update("drivers", driver.id, { status: "busy" });
  return updated;
}

export async function pickUpDelivery(user: SessionUser, deliveryId: string) {
  const driver = await requireDriver(user);
  const delivery = await getDb().get("deliveries", deliveryId);
  if (!delivery || delivery.driver_id !== driver.id) throw new OrderError("Delivery not found", 404);
  return updateOrderStatus(delivery.order_id, "out_for_delivery", user);
}

export async function completeDelivery(user: SessionUser, deliveryId: string) {
  const db = getDb();
  const driver = await requireDriver(user);
  const delivery = await db.get("deliveries", deliveryId);
  if (!delivery || delivery.driver_id !== driver.id) throw new OrderError("Delivery not found", 404);
  const order = await updateOrderStatus(delivery.order_id, "delivered", user);
  const stillActive = await db.count("deliveries", { driver_id: driver.id, status: ["assigned", "picked_up"] });
  if (!stillActive) await db.update("drivers", driver.id, { status: "available" });
  return order;
}

export async function setDriverStatus(user: SessionUser, status: DriverStatus) {
  const driver = await requireDriver(user);
  return getDb().update("drivers", driver.id, { status });
}

export async function applyAsDriver(user: SessionUser, input: z.infer<typeof driverApplicationSchema>) {
  const db = getDb();
  if (await getDriverForUser(user.id)) throw new OrderError("You've already applied", 409);
  return db.insert("drivers", {
    id: newId(),
    user_id: user.id,
    full_name: input.full_name,
    phone: input.phone,
    vehicle_type: input.vehicle_type,
    vehicle_plate: input.vehicle_plate ?? null,
    region_id: input.region_id ?? null,
    status: "offline",
    is_approved: false,
    created_at: new Date().toISOString(),
  });
}

export async function approveDriver(driverId: string, approved: boolean) {
  const db = getDb();
  const driver = await db.get("drivers", driverId);
  if (!driver) throw new OrderError("Driver not found", 404);
  await db.update("drivers", driverId, { is_approved: approved, status: approved ? driver.status : "offline" });
  if (approved) {
    const p = await db.get("profiles", driver.user_id);
    if (p && p.role === "customer") await db.update("profiles", p.id, { role: "driver" });
  }
}

export async function assignDriver(deliveryId: string, driverId: string | null) {
  const db = getDb();
  const delivery = await db.get("deliveries", deliveryId);
  if (!delivery) throw new OrderError("Delivery not found", 404);
  if (["picked_up", "delivered", "cancelled"].includes(delivery.status)) throw new OrderError("This delivery can no longer be reassigned", 409);
  return db.update("deliveries", deliveryId, {
    driver_id: driverId,
    status: driverId ? "assigned" : "unassigned",
    assigned_at: driverId ? new Date().toISOString() : null,
  });
}
