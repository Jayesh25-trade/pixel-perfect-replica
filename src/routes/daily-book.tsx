import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  PageHeader,
  Panel,
  StatusBadge,
  TableShell,
  Td,
  Th,
} from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import { money, money0, longDate, shortDate, tons } from "@/lib/format";
import { calcTrip } from "@/lib/calc";
import type { Trip } from "@/lib/types";

export const Route = createFileRoute("/daily-book")({
  head: () => ({
    meta: [
      { title: "Daily Book (Roznamcha) — Transport Books" },
      {
        name: "description",
        content:
          "Digital Roznamcha of trips with truck, LR, route, weights, party, company and Received/Pending status.",
      },
      { property: "og:title", content: "Daily Book (Roznamcha)" },
      { property: "og:description", content: "Trip-level daily entries for your fleet." },
    ],
  }),
  component: DailyBook,
});

const emptyForm = {
  date: new Date().toISOString().slice(0, 10),
  truckId: "",
  lrNo: "",
  from: "",
  to: "",
  nWeight: "",
  rWeight: "",
  advance: "",
  cash: "",
  diesel: "",
  account: "",
  companyId: "",
  partyId: "",
  customerRate: "",
  remarks: "",
  status: "PENDING" as Trip["status"],
};

function DailyBook() {
  const store = useStore();
  const { trips, trucks, parties, companies, addTrip, updateTrip } = store;

  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [partyId, setPartyId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [truckId, setTruckId] = useState("");
  const [status, setStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [detail, setDetail] = useState<Trip | null>(null);
  const [error, setError] = useState("");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return trips
      .filter((t) => (partyId ? t.partyId === partyId : true))
      .filter((t) => (companyId ? t.companyId === companyId : true))
      .filter((t) => (truckId ? t.truckId === truckId : true))
      .filter((t) => (status ? t.status === status : true))
      .filter((t) => (from ? t.date >= from : true))
      .filter((t) => (to ? t.date <= to : true))
      .filter((t) =>
        needle
          ? [
              t.lrNo,
              t.from,
              t.to,
              t.remarks,
              store.truckOf(t.truckId).number,
              store.partyOf(t.partyId).name,
              store.companyOf(t.companyId).name,
            ]
              .join(" ")
              .toLowerCase()
              .includes(needle)
          : true,
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [trips, q, from, to, partyId, companyId, truckId, status, store]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.truckId || !form.partyId || !form.companyId || !form.lrNo) {
      setError("Truck, LR No, Party and Company are required.");
      return;
    }
    const num = (v: string) => (v === "" ? 0 : Number(v));
    addTrip({
      date: form.date,
      truckId: form.truckId,
      lrNo: form.lrNo,
      from: form.from,
      to: form.to,
      nWeight: num(form.nWeight),
      rWeight: num(form.rWeight),
      advance: num(form.advance),
      cash: num(form.cash),
      diesel: num(form.diesel),
      account: num(form.account),
      companyId: form.companyId,
      partyId: form.partyId,
      customerRate: num(form.customerRate),
      remarks: form.remarks,
      status: form.status,
    });
    setForm(emptyForm);
    setError("");
    setShowForm(false);
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title={
          <>
            Daily Book — <span className="text-coral">Roznamcha</span>
          </>
        }
        description="Manual operational entries. Values you type here are never auto-overwritten."
        actions={
          <Button variant="coral" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Close entry form" : "＋ New trip"}
          </Button>
        }
      />

      {showForm && (
        <Panel className="mb-6" title="New daily entry" subtitle="Fast entry — tab through the fields.">
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
            <Field label="Date" required>
              <input type="date" className="field" value={form.date} onChange={set("date")} />
            </Field>
            <Field label="Truck No" required>
              <select className="field" value={form.truckId} onChange={set("truckId")}>
                <option value="">Select truck</option>
                {trucks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.number}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="LR No" required>
              <input className="field" placeholder="LR-4480" value={form.lrNo} onChange={set("lrNo")} />
            </Field>
            <Field label="Party (Billing Customer)" required>
              <select className="field" value={form.partyId} onChange={set("partyId")}>
                <option value="">Select party</option>
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Company (Loading Site)" required>
              <select className="field" value={form.companyId} onChange={set("companyId")}>
                <option value="">Select company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="From">
              <input className="field" placeholder="Loading point" value={form.from} onChange={set("from")} />
            </Field>
            <Field label="To">
              <input className="field" placeholder="Destination" value={form.to} onChange={set("to")} />
            </Field>
            <Field label="N-Weight (T)" hint="Loaded / challan weight">
              <input type="number" step="0.001" className="field" placeholder="40.000" value={form.nWeight} onChange={set("nWeight")} />
            </Field>
            <Field label="R-Weight (T)" hint="Received weight at unloading">
              <input type="number" step="0.001" className="field" placeholder="39.000" value={form.rWeight} onChange={set("rWeight")} />
            </Field>
            <Field label="Customer / Final Rate (₹)">
              <input type="number" className="field" placeholder="520" value={form.customerRate} onChange={set("customerRate")} />
            </Field>
            <Field label="Advance (₹)">
              <input type="number" className="field" placeholder="0" value={form.advance} onChange={set("advance")} />
            </Field>
            <Field label="Cash (₹)">
              <input type="number" className="field" placeholder="0" value={form.cash} onChange={set("cash")} />
            </Field>
            <Field label="Diesel (₹)">
              <input type="number" className="field" placeholder="0" value={form.diesel} onChange={set("diesel")} />
            </Field>
            <Field label="A/c (₹)">
              <input type="number" className="field" placeholder="0" value={form.account} onChange={set("account")} />
            </Field>
            <Field label="POCH Status" hint="Received = Billable · Pending = Unbillable">
              <select className="field" value={form.status} onChange={set("status")}>
                <option value="PENDING">Pending — Unbillable</option>
                <option value="RECEIVED">Received — Billable</option>
              </select>
            </Field>
            <Field label="Remarks">
              <input className="field" placeholder="Optional note" value={form.remarks} onChange={set("remarks")} />
            </Field>
            <div className="flex items-end gap-3 md:col-span-3 xl:col-span-4">
              <Button type="submit" variant="coral">
                Save entry
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              {error && <span className="text-sm font-semibold text-destructive">{error}</span>}
            </div>
          </form>
        </Panel>
      )}

      <Panel
        title="Entries"
        subtitle={`${rows.length} of ${trips.length} trips shown`}
      >
        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <input
            className="field"
            placeholder="Search LR, route, truck, party…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="flex gap-2">
            <input type="date" className="field" value={from} onChange={(e) => setFrom(e.target.value)} />
            <input type="date" className="field" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <select className="field" value={partyId} onChange={(e) => setPartyId(e.target.value)}>
            <option value="">All parties</option>
            {parties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select className="field" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
            <option value="">All companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select className="field" value={truckId} onChange={(e) => setTruckId(e.target.value)}>
            <option value="">All trucks</option>
            {trucks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.number}
              </option>
            ))}
          </select>
          <select className="field" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Received & Pending</option>
            <option value="RECEIVED">Received — Billable</option>
            <option value="PENDING">Pending — Unbillable</option>
          </select>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="No entries match these filters"
            message="Clear a filter, or add today's first trip to the Daily Book."
            action={
              <Button variant="coral" onClick={() => setShowForm(true)}>
                ＋ New trip
              </Button>
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <TableShell>
                <thead>
                  <tr>
                    <Th>Sr</Th>
                    <Th>Date</Th>
                    <Th>Truck</Th>
                    <Th>LR No</Th>
                    <Th>Route</Th>
                    <Th align="right">N-Wt</Th>
                    <Th align="right">R-Wt</Th>
                    <Th align="right">Shortage</Th>
                    <Th>Party (Billing)</Th>
                    <Th>Company (Site)</Th>
                    <Th align="right">Rate</Th>
                    <Th align="center">Status</Th>
                    <Th align="center">Action</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => (
                    <tr key={t.id} className="border-t-2 border-ink/10 hover:bg-sun/15">
                      <Td className="text-muted-foreground">{t.srNo}</Td>
                      <Td className="font-semibold">{shortDate(t.date)}</Td>
                      <Td>
                        <Badge tone="neutral">{store.truckOf(t.truckId).number}</Badge>
                      </Td>
                      <Td>{t.lrNo}</Td>
                      <Td>
                        {t.from} → {t.to}
                      </Td>
                      <Td align="right">{tons(t.nWeight)}</Td>
                      <Td align="right">{tons(t.rWeight)}</Td>
                      <Td align="right">{tons(Math.max(0, t.nWeight - t.rWeight))}</Td>
                      <Td>{store.partyOf(t.partyId).name}</Td>
                      <Td className="text-muted-foreground">{store.companyOf(t.companyId).name}</Td>
                      <Td align="right">{money0(t.customerRate)}</Td>
                      <Td align="center">
                        <button onClick={() => updateTrip(t.id, { status: t.status === "RECEIVED" ? "PENDING" : "RECEIVED" })}>
                          <StatusBadge status={t.status} />
                        </button>
                      </Td>
                      <Td align="center">
                        <button
                          onClick={() => setDetail(t)}
                          className="rounded-full border-2 border-ink px-3 py-1 text-xs font-semibold hover:bg-ink hover:text-ink-foreground"
                        >
                          View
                        </button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
              <p className="mt-3 text-xs text-muted-foreground">
                Tip: click a status badge to toggle between Received (Billable) and Pending (Unbillable).
              </p>
            </div>

            {/* Mobile cards */}
            <div className="grid gap-3 md:hidden">
              {rows.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setDetail(t)}
                  className="rounded-2xl border-2 border-ink/15 bg-white p-4 text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-base font-bold">{store.truckOf(t.truckId).number}</span>
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {shortDate(t.date)} · {t.lrNo} · {t.from} → {t.to}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <span>N {tons(t.nWeight)}</span>
                    <span>R {tons(t.rWeight)}</span>
                    <span className="col-span-2 font-semibold">{store.partyOf(t.partyId).name}</span>
                    <span className="col-span-2 text-muted-foreground">{store.companyOf(t.companyId).name}</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </Panel>

      {detail && <TripDetail trip={detail} onClose={() => setDetail(null)} />}
    </>
  );
}

function TripDetail({ trip, onClose }: { trip: Trip; onClose: () => void }) {
  const store = useStore();
  const party = store.partyOf(trip.partyId);
  const calc = calcTrip(trip, party);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-4 sm:items-center">
      <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-3xl border-2 border-ink bg-card p-6 shadow-flat">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold tracking-[0.2em] text-coral uppercase">Trip detail</div>
            <h3 className="font-display text-2xl font-bold">
              {store.truckOf(trip.truckId).number} · {trip.lrNo}
            </h3>
            <p className="text-sm text-muted-foreground">
              {longDate(trip.date)} · {trip.from} → {trip.to}
            </p>
          </div>
          <StatusBadge status={trip.status} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Detail label="Party (Billing Customer)" value={party.name} />
          <Detail label="Company (Loading Site)" value={store.companyOf(trip.companyId).name} />
          <Detail label="N-Weight" value={tons(trip.nWeight)} />
          <Detail label="R-Weight" value={tons(trip.rWeight)} />
          <Detail label="Shortage (N − R)" value={tons(calc.shortage)} />
          <Detail label="Allowance" value={tons(calc.allowanceQty)} />
          <Detail label="Freight rate" value={money(trip.customerRate)} />
          <Detail label="Material rate (shortage valuation)" value={money(party.rule.materialRate)} />
          <Detail label="Remarks" value={trip.remarks || "—"} />
          <Detail label="Billed on" value={trip.billId ? `Bill linked` : "Not billed yet"} />
        </div>

        <div className="mt-5 rounded-2xl bg-ink px-5 py-4 text-ink-foreground">
          <div className="text-[11px] tracking-[0.18em] uppercase opacity-60">Driver voucher (operational)</div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <span>Advance {money0(trip.advance)}</span>
            <span>Cash {money0(trip.cash)}</span>
            <span>Diesel {money0(trip.diesel)}</span>
            <span>A/c {money0(trip.account)}</span>
          </div>
          <p className="mt-2 text-xs opacity-60">Accounting treatment pending confirmation.</p>
        </div>

        <div className="mt-5 flex justify-end">
          <Button variant="ink" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border-2 border-ink/12 bg-white px-4 py-3">
      <div className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">{label}</div>
      <div className="mt-0.5 text-sm font-semibold tnum">{value}</div>
    </div>
  );
}
