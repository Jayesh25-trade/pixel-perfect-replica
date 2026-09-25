import type { Bill, CustomerRule, Party, Payment, Trip } from "./types";

export interface TripCalc {
  shortage: number;
  allowanceQty: number;
  applicableShortage: number;
  freightQty: number;
  freight: number;
  shortageDebit: number;
  rule: CustomerRule;
}

/** SHORTAGE = N-Weight − R-Weight (never reversed). */
export function shortageOf(trip: Trip): number {
  return Math.max(0, +(trip.nWeight - trip.rWeight).toFixed(3));
}

export function allowanceQty(trip: Trip, rule: CustomerRule): number {
  if (rule.allowanceType === "PERCENT") {
    const basisWeight = rule.freightBasis === "R_WEIGHT" ? trip.rWeight : trip.nWeight;
    return +((basisWeight * rule.allowanceValue) / 100).toFixed(3);
  }
  if (rule.allowanceType === "KG") return +(rule.allowanceValue / 1000).toFixed(3);
  return +rule.allowanceValue.toFixed(3);
}

export function calcTrip(trip: Trip, party: Party): TripCalc {
  const rule = party.rule;
  const rate = trip.customerRate || rule.freightRate;

  const freightQty =
    rule.freightBasis === "R_WEIGHT"
      ? trip.rWeight
      : rule.freightBasis === "N_WEIGHT"
        ? trip.nWeight
        : 1;
  const freight =
    rule.freightBasis === "FIXED" ? rate : +(freightQty * rate).toFixed(2);

  const shortage = shortageOf(trip);
  const allow = allowanceQty(trip, rule);

  let applicable = 0;
  if (rule.shortageDebit && shortage > allow) {
    applicable =
      rule.shortageRule === "A_EXCESS_ONLY" ? +(shortage - allow).toFixed(3) : shortage;
  }

  return {
    shortage,
    allowanceQty: allow,
    applicableShortage: applicable,
    freightQty,
    freight,
    /** Applicable shortage × MATERIAL rate (never the freight rate). */
    shortageDebit: +(applicable * rule.materialRate).toFixed(2),
    rule,
  };
}

export interface BillTotals {
  grossFreight: number;
  shortageDebit: number;
  tds: number;
  net: number;
  lines: { trip: Trip; party: Party; calc: TripCalc }[];
}

export function calcBill(
  trips: Trip[],
  partyOf: (id: string) => Party,
  tdsPercent: number,
): BillTotals {
  const lines = trips.map((trip) => {
    const party = partyOf(trip.partyId);
    return { trip, party, calc: calcTrip(trip, party) };
  });
  const grossFreight = +lines.reduce((s, l) => s + l.calc.freight, 0).toFixed(2);
  const shortageDebit = +lines.reduce((s, l) => s + l.calc.shortageDebit, 0).toFixed(2);
  const tds = +((grossFreight * tdsPercent) / 100).toFixed(2);
  return {
    grossFreight,
    shortageDebit,
    tds,
    net: +(grossFreight - shortageDebit - tds).toFixed(2),
    lines,
  };
}

export function receivedAgainstBill(billId: string, payments: Payment[]): number {
  return +payments
    .flatMap((p) => p.allocations)
    .filter((a) => a.billId === billId)
    .reduce((s, a) => s + a.amount, 0)
    .toFixed(2);
}

export function unallocatedAdvance(partyId: string, payments: Payment[]): number {
  return +payments
    .filter((p) => p.partyId === partyId && p.kind === "ADVANCE")
    .reduce(
      (s, p) => s + p.amount - p.allocations.reduce((a, x) => a + x.amount, 0),
      0,
    )
    .toFixed(2);
}

export function billStatus(net: number, received: number): Bill["status"] {
  if (received <= 0) return "PENDING";
  if (received >= net - 0.5) return "PAID";
  return "PARTIALLY_PAID";
}

export const AGING_BUCKETS = [
  { key: "current", label: "Current", min: 0, max: 0 },
  { key: "b1", label: "1–30", min: 1, max: 30 },
  { key: "b2", label: "31–60", min: 31, max: 60 },
  { key: "b3", label: "61–90", min: 61, max: 90 },
  { key: "b4", label: "91–180", min: 91, max: 180 },
  { key: "b5", label: "181+", min: 181, max: Infinity },
] as const;

export function bucketFor(days: number): string {
  return AGING_BUCKETS.find((b) => days >= b.min && days <= b.max)?.key ?? "b5";
}

export const FREIGHT_BASIS_LABEL: Record<CustomerRule["freightBasis"], string> = {
  R_WEIGHT: "R-Weight × Rate",
  N_WEIGHT: "N-Weight × Rate",
  FIXED: "Fixed per trip",
};

export const SHORTAGE_RULE_LABEL: Record<CustomerRule["shortageRule"], string> = {
  A_EXCESS_ONLY: "Rule A — Excess only",
  B_FULL_SHORTAGE: "Rule B — Full shortage",
};
