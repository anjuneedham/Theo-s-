import type { OperatingHours } from "./types";

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

/** Local day-of-week and minutes-since-midnight in the restaurant's time zone. */
export function localClock(date: Date, timeZone: string): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  const hour = Number(get("hour")) % 24;
  return { day, minutes: hour * 60 + Number(get("minute")) };
}

/**
 * Is the restaurant open? Supports closing times past midnight (e.g. a lounge
 * open 18:00–02:00 on Friday is still "Friday's" session at 01:00 Saturday).
 */
export function isOpenAt(hours: OperatingHours[], timeZone: string, date = new Date()): boolean {
  const { day, minutes } = localClock(date, timeZone);
  const today = hours.find((h) => h.day_of_week === day);
  const yesterday = hours.find((h) => h.day_of_week === (day + 6) % 7);

  if (today && !today.is_closed) {
    const open = toMinutes(today.opens_at);
    const close = toMinutes(today.closes_at);
    if (close > open ? minutes >= open && minutes < close : minutes >= open) return true;
  }
  if (yesterday && !yesterday.is_closed) {
    const open = toMinutes(yesterday.opens_at);
    const close = toMinutes(yesterday.closes_at);
    if (close <= open && minutes < close) return true;
  }
  return false;
}

export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 && h < 24 ? "pm" : "am";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m ? `${hour}:${String(m).padStart(2, "0")}${suffix}` : `${hour}${suffix}`;
}

export function formatHoursRow(h: OperatingHours | undefined): string {
  if (!h || h.is_closed) return "Closed";
  return `${formatTime(h.opens_at)} – ${formatTime(h.closes_at)}`;
}

/** Is a menu category (e.g. breakfast) currently being served? */
export function isWithinWindow(from: string | null, until: string | null, timeZone: string, date = new Date()): boolean {
  if (!from || !until) return true;
  const { minutes } = localClock(date, timeZone);
  const a = toMinutes(from);
  const b = toMinutes(until);
  return b > a ? minutes >= a && minutes < b : minutes >= a || minutes < b;
}
