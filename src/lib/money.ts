const SYMBOLS: Record<string, string> = { JMD: "J$", USD: "US$", TTD: "TT$", BBD: "Bds$", KYD: "CI$", XCD: "EC$" };

/** Format integer minor units (cents) as a display price, e.g. 195000 JMD → "J$1,950". */
export function formatMoney(cents: number, currency = "JMD"): string {
  const negative = cents < 0;
  const abs = Math.abs(cents) / 100;
  const whole = Number.isInteger(abs);
  const number = abs.toLocaleString("en-US", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  });
  const symbol = SYMBOLS[currency] ?? `${currency} `;
  return `${negative ? "−" : ""}${symbol}${number}`;
}

/** Parse a user-entered price ("1,950.50") into cents. Returns null if invalid. */
export function parseMoneyInput(value: string): number | null {
  const cleaned = value.replace(/[^0-9.]/g, "");
  if (!cleaned || !/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  return Math.round(parseFloat(cleaned) * 100);
}

export function bpsToPercent(bps: number): string {
  return `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 2)}%`;
}
