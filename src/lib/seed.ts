import type {
  Bill,
  Company,
  CustomerRule,
  Firm,
  Party,
  Payment,
  Trip,
  Truck,
} from "./types";

export const FIRMS: Firm[] = [
  {
    id: "deepraj",
    name: "Deepraj Transport",
    short: "DT",
    gstin: "27AAJCD1234F1ZP",
    place: "Nagpur, Maharashtra",
  },
  {
    id: "shivsai",
    name: "Shiv Sai Transport",
    short: "SS",
    gstin: "27AAKCS5678H1ZQ",
    place: "Chandrapur, Maharashtra",
  },
];

const rule = (r: Partial<CustomerRule>): CustomerRule => ({
  freightBasis: "R_WEIGHT",
  freightRate: 500,
  shortageDebit: true,
  shortageRule: "A_EXCESS_ONLY",
  allowanceType: "PERCENT",
  allowanceValue: 1,
  materialRate: 5000,
  tdsApplicable: true,
  tdsSection: "194C",
  tdsPercent: 1,
  ...r,
});

export const PARTIES: Party[] = [
  {
    id: "p1",
    firmId: "deepraj",
    name: "Fairway Dream Pvt. Ltd.",
    gstin: "27AACCF2211L1ZT",
    city: "Nagpur",
    openingBalance: 0,
    rule: rule({ freightRate: 520, allowanceType: "PERCENT", allowanceValue: 1 }),
  },
  {
    id: "p2",
    firmId: "deepraj",
    name: "Vedant Steel Traders",
    gstin: "27AADCV9087K1ZB",
    city: "Bhandara",
    openingBalance: 0,
    rule: rule({
      freightBasis: "N_WEIGHT",
      freightRate: 480,
      allowanceType: "PERCENT",
      allowanceValue: 0.5,
      shortageRule: "B_FULL_SHORTAGE",
      materialRate: 4600,
    }),
  },
  {
    id: "p3",
    firmId: "deepraj",
    name: "Shreeji Cement Co.",
    gstin: "27AAECS4412M1Z9",
    city: "Wardha",
    openingBalance: 0,
    rule: rule({
      allowanceType: "KG",
      allowanceValue: 150,
      materialRate: 5200,
      freightRate: 540,
    }),
  },
  {
    id: "p4",
    firmId: "deepraj",
    name: "Kisan Agro Exports",
    gstin: "27AAFCK7781N1ZD",
    city: "Amravati",
    openingBalance: 0,
    rule: rule({
      freightBasis: "FIXED",
      freightRate: 21000,
      allowanceType: "KG",
      allowanceValue: 300,
      shortageDebit: true,
      materialRate: 4800,
      tdsPercent: 2,
    }),
  },
  {
    id: "p5",
    firmId: "shivsai",
    name: "Deccan Minerals Ltd.",
    gstin: "27AAGCD3312P1ZF",
    city: "Chandrapur",
    openingBalance: 0,
    rule: rule({ freightRate: 610, allowanceType: "TON", allowanceValue: 0.4 }),
  },
  {
    id: "p6",
    firmId: "shivsai",
    name: "Sai Roadlines Contractors",
    gstin: "27AAHCS2290Q1ZG",
    city: "Ballarpur",
    openingBalance: 0,
    rule: rule({ shortageDebit: false, tdsApplicable: false, tdsPercent: 0 }),
  },
];

export const COMPANIES: Company[] = [
  { id: "c1", firmId: "deepraj", name: "Ambuja Loading Point", site: "Butibori MIDC" },
  { id: "c2", firmId: "deepraj", name: "Western Coal Depot", site: "Kanhan Siding" },
  { id: "c3", firmId: "deepraj", name: "Nagpur Steel Yard", site: "Hingna Road" },
  { id: "c4", firmId: "shivsai", name: "Ballarpur Paper Unit", site: "Ballarpur Gate 2" },
  { id: "c5", firmId: "shivsai", name: "Chandrapur Mine Head", site: "Durgapur Block" },
];

export const TRUCKS: Truck[] = [
  { id: "t1", firmId: "deepraj", number: "MH-12-AB-1234", ownership: "Own", driver: "Ramesh Yadav" },
  { id: "t2", firmId: "deepraj", number: "MH-31-CD-5678", ownership: "Own", driver: "Sanjay Pawar" },
  { id: "t3", firmId: "deepraj", number: "MH-40-EF-9012", ownership: "Attached", driver: "Imran Shaikh" },
  { id: "t4", firmId: "shivsai", number: "MH-34-GH-3456", ownership: "Own", driver: "Vikas Meshram" },
  { id: "t5", firmId: "shivsai", number: "MH-34-IJ-7890", ownership: "Attached", driver: "Dilip Rathod" },
];

let sr = 0;
const trip = (t: Omit<Trip, "srNo" | "id"> & { id: string }): Trip => ({
  ...t,
  srNo: ++sr,
  });

export const TRIPS: Trip[] = [
  trip({
    id: "tr1", firmId: "deepraj", date: "2026-08-04", truckId: "t1", lrNo: "LR-4471",
    from: "Butibori", to: "Raipur", nWeight: 40, rWeight: 39, advance: 8000, cash: 2000,
    diesel: 12000, account: 5000, companyId: "c1", partyId: "p1", customerRate: 520,
    remarks: "Cement bags", status: "RECEIVED", billId: "b1",
  }),
  trip({
    id: "tr2", firmId: "deepraj", date: "2026-08-06", truckId: "t2", lrNo: "LR-4472",
    from: "Kanhan", to: "Nagpur", nWeight: 32, rWeight: 31.2, advance: 6000, cash: 1500,
    diesel: 9000, account: 3000, companyId: "c2", partyId: "p2", customerRate: 480,
    remarks: "Coal", status: "RECEIVED", billId: "b1",
  }),
  trip({
    id: "tr3", firmId: "deepraj", date: "2026-08-09", truckId: "t3", lrNo: "LR-4473",
    from: "Hingna", to: "Bhopal", nWeight: 28, rWeight: 27.8, advance: 5000, cash: 1000,
    diesel: 8500, account: 2500, companyId: "c3", partyId: "p3", customerRate: 540,
    remarks: "TMT bars", status: "RECEIVED", billId: "b1",
  }),
  trip({
    id: "tr4", firmId: "deepraj", date: "2026-08-14", truckId: "t1", lrNo: "LR-4474",
    from: "Butibori", to: "Indore", nWeight: 40, rWeight: 39.8, advance: 9000, cash: 2500,
    diesel: 13500, account: 4000, companyId: "c1", partyId: "p4", customerRate: 21000,
    remarks: "Fixed freight trip", status: "RECEIVED", billId: "b2",
  }),
  trip({
    id: "tr5", firmId: "deepraj", date: "2026-08-18", truckId: "t2", lrNo: "LR-4475",
    from: "Kanhan", to: "Jabalpur", nWeight: 36, rWeight: 35.4, advance: 7000, cash: 1800,
    diesel: 11000, account: 3500, companyId: "c2", partyId: "p1", customerRate: 520,
    remarks: "", status: "RECEIVED", billId: "b2",
  }),
  trip({
    id: "tr6", firmId: "deepraj", date: "2026-09-02", truckId: "t3", lrNo: "LR-4476",
    from: "Hingna", to: "Pune", nWeight: 30, rWeight: 29.5, advance: 6500, cash: 1200,
    diesel: 10500, account: 3000, companyId: "c3", partyId: "p2", customerRate: 480,
    remarks: "Awaiting POCH", status: "PENDING", billId: null,
  }),
  trip({
    id: "tr7", firmId: "deepraj", date: "2026-09-08", truckId: "t1", lrNo: "LR-4477",
    from: "Butibori", to: "Nashik", nWeight: 40, rWeight: 39.6, advance: 8500, cash: 2000,
    diesel: 12500, account: 4500, companyId: "c1", partyId: "p3", customerRate: 540,
    remarks: "", status: "RECEIVED", billId: null,
  }),
  trip({
    id: "tr8", firmId: "deepraj", date: "2026-09-15", truckId: "t2", lrNo: "LR-4478",
    from: "Kanhan", to: "Akola", nWeight: 34, rWeight: 33.9, advance: 6000, cash: 1500,
    diesel: 9500, account: 2800, companyId: "c2", partyId: "p1", customerRate: 520,
    remarks: "", status: "RECEIVED", billId: null,
  }),
  trip({
    id: "tr9", firmId: "deepraj", date: "2026-09-19", truckId: "t3", lrNo: "LR-4479",
    from: "Hingna", to: "Raipur", nWeight: 29, rWeight: 28.2, advance: 5500, cash: 1000,
    diesel: 8800, account: 2200, companyId: "c3", partyId: "p4", customerRate: 21000,
    remarks: "Unloading delayed", status: "PENDING", billId: null,
  }),
  trip({
    id: "tr10", firmId: "shivsai", date: "2026-08-21", truckId: "t4", lrNo: "SS-2201",
    from: "Durgapur Block", to: "Chandrapur", nWeight: 38, rWeight: 37.2, advance: 7000,
    cash: 2000, diesel: 11500, account: 3000, companyId: "c5", partyId: "p5",
    customerRate: 610, remarks: "Mineral load", status: "RECEIVED", billId: "b3",
  }),
  trip({
    id: "tr11", firmId: "shivsai", date: "2026-09-05", truckId: "t5", lrNo: "SS-2202",
    from: "Ballarpur", to: "Nagpur", nWeight: 26, rWeight: 25.8, advance: 4500, cash: 1000,
    diesel: 7500, account: 2000, companyId: "c4", partyId: "p6", customerRate: 500,
    remarks: "", status: "RECEIVED", billId: null,
  }),
  trip({
    id: "tr12", firmId: "shivsai", date: "2026-09-17", truckId: "t4", lrNo: "SS-2203",
    from: "Durgapur Block", to: "Wardha", nWeight: 35, rWeight: 34.1, advance: 6800,
    cash: 1600, diesel: 10200, account: 2600, companyId: "c5", partyId: "p5",
    customerRate: 610, remarks: "", status: "PENDING", billId: null,
  }),
];

export const BILLS: Bill[] = [
  {
    id: "b1", firmId: "deepraj", number: 1, date: "2026-08-12", partyId: "p1",
    tripIds: ["tr1", "tr2", "tr3"], tdsSection: "194C", tdsPercent: 1, status: "POSTED",
  },
  {
    id: "b2", firmId: "deepraj", number: 2, date: "2026-08-25", partyId: "p4",
    tripIds: ["tr4", "tr5"], tdsSection: "194C", tdsPercent: 2, status: "POSTED",
  },
  {
    id: "b3", firmId: "shivsai", number: 1, date: "2026-08-28", partyId: "p5",
    tripIds: ["tr10"], tdsSection: "194C", tdsPercent: 1, status: "POSTED",
  },
];

export const PAYMENTS: Payment[] = [
  {
    id: "pay1", firmId: "deepraj", date: "2026-09-01", partyId: "p1",
    kind: "AGAINST_BILL", amount: 50000, mode: "NEFT", bankName: "HDFC Bank",
    reference: "UTR-9928114", allocations: [{ billId: "b1", amount: 50000 }],
    narration: "Part payment against Bill #1",
  },
  {
    id: "pay2", firmId: "deepraj", date: "2026-09-10", partyId: "p1",
    kind: "ADVANCE", amount: 10000, mode: "UPI", reference: "UPI-4471209",
    allocations: [], narration: "Advance received",
  },
  {
    id: "pay3", firmId: "shivsai", date: "2026-09-12", partyId: "p5",
    kind: "AGAINST_BILL", amount: 120000, mode: "RTGS", bankName: "SBI",
    reference: "UTR-5512099", allocations: [{ billId: "b3", amount: 120000 }],
    narration: "Against Bill #1",
  },
];
