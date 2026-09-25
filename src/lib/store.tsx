import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { BILLS, COMPANIES, FIRMS, PARTIES, PAYMENTS, TRIPS, TRUCKS } from "./seed";
import type {
  Bill,
  Company,
  Firm,
  FirmId,
  Party,
  Payment,
  Trip,
  Truck,
} from "./types";
import { billStatus, calcBill, receivedAgainstBill, unallocatedAdvance } from "./calc";

interface StoreValue {
  firms: Firm[];
  firm: Firm;
  setFirmId: (id: FirmId) => void;
  parties: Party[];
  companies: Company[];
  trucks: Truck[];
  trips: Trip[];
  bills: Bill[];
  payments: Payment[];
  partyOf: (id: string) => Party;
  companyOf: (id: string) => Company;
  truckOf: (id: string) => Truck;
  addTrip: (t: Omit<Trip, "id" | "srNo" | "firmId" | "billId">) => void;
  updateTrip: (id: string, patch: Partial<Trip>) => void;
  addBill: (b: Omit<Bill, "id" | "number" | "firmId" | "status">) => Bill;
  addPayment: (p: Omit<Payment, "id" | "firmId">) => void;
  allocateAdvance: (paymentId: string, billId: string, amount: number) => void;
  billSummary: (bill: Bill) => {
    gross: number;
    shortage: number;
    tds: number;
    net: number;
    received: number;
    outstanding: number;
    status: Bill["status"];
  };
}

const StoreContext = createContext<StoreValue | null>(null);

let seq = 1000;
const nextId = (p: string) => `${p}${++seq}`;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [firmId, setFirmId] = useState<FirmId>("deepraj");
  const [parties] = useState<Party[]>(PARTIES);
  const [companies] = useState<Company[]>(COMPANIES);
  const [trucks] = useState<Truck[]>(TRUCKS);
  const [trips, setTrips] = useState<Trip[]>(TRIPS);
  const [bills, setBills] = useState<Bill[]>(BILLS);
  const [payments, setPayments] = useState<Payment[]>(PAYMENTS);

  const firm = FIRMS.find((f) => f.id === firmId)!;

  const partyOf = useCallback(
    (id: string) => PARTIES.find((p) => p.id === id)!,
    [],
  );
  const companyOf = useCallback(
    (id: string) => COMPANIES.find((c) => c.id === id)!,
    [],
  );
  const truckOf = useCallback((id: string) => TRUCKS.find((t) => t.id === id)!, []);

  const scoped = useMemo(
    () => ({
      parties: parties.filter((p) => p.firmId === firmId),
      companies: companies.filter((c) => c.firmId === firmId),
      trucks: trucks.filter((t) => t.firmId === firmId),
      trips: trips.filter((t) => t.firmId === firmId),
      bills: bills.filter((b) => b.firmId === firmId),
      payments: payments.filter((p) => p.firmId === firmId),
    }),
    [parties, companies, trucks, trips, bills, payments, firmId],
  );

  const addTrip: StoreValue["addTrip"] = (t) => {
    setTrips((prev) => [
      {
        ...t,
        id: nextId("tr"),
        srNo: prev.filter((x) => x.firmId === firmId).length + 1,
        firmId,
        billId: null,
      },
      ...prev,
    ]);
  };

  const updateTrip: StoreValue["updateTrip"] = (id, patch) => {
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const addBill: StoreValue["addBill"] = (b) => {
    const number = bills.filter((x) => x.firmId === firmId).length + 1;
    const bill: Bill = { ...b, id: nextId("b"), number, firmId, status: "POSTED" };
    setBills((prev) => [bill, ...prev]);
    setTrips((prev) =>
      prev.map((t) => (b.tripIds.includes(t.id) ? { ...t, billId: bill.id } : t)),
    );
    return bill;
  };

  const addPayment: StoreValue["addPayment"] = (p) => {
    setPayments((prev) => [{ ...p, id: nextId("pay"), firmId }, ...prev]);
  };

  const allocateAdvance: StoreValue["allocateAdvance"] = (paymentId, billId, amount) => {
    setPayments((prev) =>
      prev.map((p) =>
        p.id === paymentId
          ? { ...p, allocations: [...p.allocations, { billId, amount }] }
          : p,
      ),
    );
  };

  const billSummary: StoreValue["billSummary"] = useCallback(
    (bill) => {
      const billTrips = trips.filter((t) => bill.tripIds.includes(t.id));
      const totals = calcBill(billTrips, partyOf, bill.tdsPercent);
      const received = receivedAgainstBill(bill.id, payments);
      return {
        gross: totals.grossFreight,
        shortage: totals.shortageDebit,
        tds: totals.tds,
        net: totals.net,
        received,
        outstanding: +(totals.net - received).toFixed(2),
        status: billStatus(totals.net, received),
      };
    },
    [trips, payments, partyOf],
  );

  const value: StoreValue = {
    firms: FIRMS,
    firm,
    setFirmId,
    ...scoped,
    partyOf,
    companyOf,
    truckOf,
    addTrip,
    updateTrip,
    addBill,
    addPayment,
    allocateAdvance,
    billSummary,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export { unallocatedAdvance };
