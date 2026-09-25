import "server-only";
import { redirect } from "next/navigation";
import { getDb } from "../db";
import type { Restaurant, RestaurantMemberRole, UserRole } from "../types";
import { getSessionUser, type SessionUser } from "./session";

export class ForbiddenError extends Error {
  status = 403;
  constructor(message = "You don't have permission to do that") {
    super(message);
  }
}
export class UnauthorizedError extends Error {
  status = 401;
  constructor(message = "Please sign in") {
    super(message);
  }
}

/** For pages: redirect to login when signed out. */
export async function requirePageUser(next: string, roles?: UserRole[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (roles && !roles.includes(user.role)) redirect("/forbidden");
  return user;
}

/** For API routes / server actions: throw instead of redirecting. */
export async function requireUser(roles?: UserRole[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new UnauthorizedError();
  if (roles && !roles.includes(user.role)) throw new ForbiddenError();
  return user;
}

export interface RestaurantAccess {
  restaurant: Restaurant;
  role: RestaurantMemberRole | "admin";
}

/** Restaurants the user can manage (admins can manage all). */
export async function managedRestaurants(user: SessionUser): Promise<RestaurantAccess[]> {
  const db = getDb();
  if (user.role === "admin") {
    const all = await db.list("restaurants", {}, { orderBy: "name" });
    return all.map((restaurant) => ({ restaurant, role: "admin" as const }));
  }
  const memberships = await db.list("restaurant_users", { user_id: user.id });
  if (memberships.length === 0) return [];
  const restaurants = await db.list("restaurants", { id: memberships.map((m) => m.restaurant_id) });
  return restaurants.map((restaurant) => ({
    restaurant,
    role: memberships.find((m) => m.restaurant_id === restaurant.id)!.role,
  }));
}

export async function requireRestaurantAccess(
  user: SessionUser,
  restaurantId: string,
  roles: RestaurantMemberRole[] = ["owner", "manager", "staff"],
): Promise<RestaurantAccess> {
  const access = (await managedRestaurants(user)).find((a) => a.restaurant.id === restaurantId);
  if (!access) throw new ForbiddenError("You don't have access to this restaurant");
  if (access.role !== "admin" && !roles.includes(access.role)) throw new ForbiddenError();
  return access;
}
