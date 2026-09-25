const inr = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const inr0 = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** ₹1,26,070.00 */
export function money(value: number): string {
  const sign = value < 0 ? "-" : "";
  return `${sign}₹${inr.format(Math.abs(value))}`;
}

/** ₹1,26,070 (compact rows) */
export function money0(value: number): string {
  const sign = value < 0 ? "-" : "";
  return `${sign}₹${inr0.format(Math.abs(value))}`;
}

/** 40.000 T */
export function tons(value: number): string {
  return `${value.toFixed(3)} T`;
}

/** 150 KG */
export function kg(value: number): string {
  return `${inr0.format(value)} KG`;
}

/** 1.00% */
export function pct(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function shortDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

export function longDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = new Date(fromIso + "T00:00:00").getTime();
  const b = new Date(toIso + "T00:00:00").getTime();
  return Math.max(0, Math.round((b - a) / 86_400_000));
}
