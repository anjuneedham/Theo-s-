"use client";

type EventName = "page_view" | "menu_view" | "product_view" | "add_to_cart" | "checkout_started" | "checkout_completed" | "restaurant_view" | "search";

function sessionId(): string {
  try {
    let id = sessionStorage.getItem("theos-sid");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("theos-sid", id);
    }
    return id;
  } catch {
    return "anon";
  }
}

/** First-party, cookie-free event tracking (stored in analytics_events). */
export function track(name: EventName, data: { restaurant_id?: string | null; properties?: Record<string, string | number | boolean | null> } = {}) {
  if (typeof window === "undefined") return;
  const body = JSON.stringify({ name, session_id: sessionId(), path: window.location.pathname, ...data });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/v1/events", new Blob([body], { type: "application/json" }));
      return;
    }
  } catch {
    // fall through
  }
  fetch("/api/v1/events", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => undefined);
}
