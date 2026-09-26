export type FirmId = "deepraj" | "shivsai";

export interface Firm {
  id: FirmId;
  name: string;
  short: string;
  gstin: string;
  place: string;
}

export type FreightBasis = "R_WEIGHT" | "N_WEIGHT" | "FIXED";
export type ShortageRule = "A_EXCESS_ONLY" | "B_FULL_SHORTAGE";
export type AllowanceType = "PERCENT" | "KG" | "TON";

export interface CustomerRule {
  freightBasis: FreightBasis;
  /** Freight rate per tonne, or fixed freight per trip when basis is FIXED. */
  freightRate: number;
  shortageDebit: boolean;
  shortageRule: ShortageRule;
  allowanceType: AllowanceType;
  allowanceValue: number;
  /** Used ONLY to value shortage debit. Not the freight rate. */
  materialRate: number;
  tdsApplicable: boolean;
  tdsSection: string;
  tdsPercent: number;
}

export interface Party {
  id: string;
  firmId: FirmId;
  name: string;
  gstin: string;
  city: string;
  openingBalance: number;
  rule: CustomerRule;
}

export interface Company {
  id: string;
  firmId: FirmId;
  name: string;
  site: string;
}

export interface Truck {
  id: string;
  firmId: FirmId;
  number: string;
  ownership: "Own" | "Attached";
  driver: string;
}

export type TripStatus = "RECEIVED" | "PENDING";

export interface Trip {
  id: string;
  firmId: FirmId;
  srNo: number;
  date: string;
  truckId: string;
  lrNo: string;
  from: string;
  to: string;
  nWeight: number;
  rWeight: number;
  advance: number;
  cash: number;
  diesel: number;
  account: number;
  companyId: string;
  partyId: string;
  /** Manually entered customer/final freight rate for this trip. */
  customerRate: number;
  remarks: string;
  status: TripStatus;
  billId: string | null;
}

export type BillStatus = "POSTED" | "PENDING" | "PARTIALLY_PAID" | "PAID";

export interface Bill {
  id: string;
  firmId: FirmId;
  number: number;
  date: string;
  /** Billing party the invoice is raised on. */
  partyId: string;
  tripIds: string[];
  tdsSection: string;
  tdsPercent: number;
  status: Exclude<BillStatus, "PARTIALLY_PAID" | "PAID"> | BillStatus;
}

export type PaymentMode = "CASH" | "BANK" | "CHEQUE" | "NEFT" | "RTGS" | "UPI";
export type PaymentKind = "AGAINST_BILL" | "ADVANCE";

export interface Payment {
  id: string;
  firmId: FirmId;
  date: string;
  partyId: string;
  kind: PaymentKind;
  amount: number;
  mode: PaymentMode;
  bankName?: string | undefined;
  reference?: string | undefined;
  /** Allocations against bill ids; advances may be partially allocated. */
  allocations: { billId: string; amount: number }[];
  narration?: string | undefined;
}
