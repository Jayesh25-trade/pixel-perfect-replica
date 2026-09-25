import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  PageHeader,
  Panel,
  TableShell,
  Td,
  Th,
} from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import { money, longDate, shortDate, tons, pct } from "@/lib/format";
import { calcBill, calcTrip, FREIGHT_BASIS_LABEL, SHORTAGE_RULE_LABEL } from "@/lib/calc";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/bills/create")({
  head: () => ({
    meta: [
      { title: "Create Bill — Transport Books" },
      {
        name: "description",
        content:
          "Step-by-step billing: pick received trips, review per-customer shortage rules, preview TDS and post the bill.",
      },
      { property: "og:title", content: "Create Bill" },
      { property: "og:description", content: "Mixed-customer billing with per-trip rules." },
    ],
  }),
  component: CreateBill,
});

const STEPS = ["Bill setup", "Select trips", "Review", "Calculation", "Confirm"];

function CreateBill() {
  const store = useStore();
  const navigate = useNavigate();
  const { parties, trips, bills, partyOf } = store;

  const [step, setStep] = useState(0);
  const [partyId, setPartyId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [tdsSection, setTdsSection] = useState("194C");
  const [tdsPercent, setTdsPercent] = useState("1");
  const [selected, setSelected] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterParty, setFilterParty] = useState("");
  const nextNumber = bills.length + 1;

  const billable = useMemo(
    () =>
      trips
        .filter((t) => t.status === "RECEIVED" && !t.billId)
        .filter((t) => (filterParty ? t.partyId === filterParty : true))
        .filter((t) => (fromDate ? t.date >= fromDate : true))
        .filter((t) => (toDate ? t.date <= toDate : true))
        .filter((t) =>
          q
            ? [t.lrNo, t.from, t.to, store.truckOf(t.truckId).number, partyOf(t.partyId).name]
                .join(" ")
                .toLowerCase()
                .includes(q.toLowerCase())
            : true,
        ),
    [trips, filterParty, fromDate, toDate, q, store, partyOf],
  );

  const chosen = trips.filter((t) => selected.includes(t.id));
  const totals = calcBill(chosen, partyOf, Number(tdsPercent) || 0);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const canNext =
    (step === 0 && partyId) ||
    (step === 1 && selected.length > 0) ||
    step === 2 ||
    step === 3;

  function post() {
    const bill = store.addBill({
      date,
      partyId,
      tripIds: selected,
      tdsSection,
      tdsPercent: Number(tdsPercent) || 0,
    });
    if (bill) navigate({ to: "/bills" });
  }

  return (
    <>
      <PageHeader
        eyebrow="Accounts"
        title="Create Bill"
        description="One bill may contain trips from different parties — every trip resolves its own customer rule."
      />

      <Panel className="mb-6">
        <ol className="flex flex-wrap items-center gap-3">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span
                className={cn(
                  "font-display grid size-8 place-items-center rounded-full text-sm font-bold",
                  i < step && "bg-turq text-ink",
                  i === step && "bg-coral text-coral-foreground",
                  i > step && "bg-ink/10 text-ink/40",
                )}
              >
                {i + 1}
              </span>
              <span className={cn("text-sm font-semibold", i === step ? "text-ink" : "text-muted-foreground")}>
                {s}
              </span>
              {i < STEPS.length - 1 && <span className="mx-1 hidden h-0.5 w-6 bg-ink/15 sm:block" />}
            </li>
          ))}
        </ol>
      </Panel>

      {step === 0 && (
        <Panel title="Bill setup" subtitle={`Bill number ${nextNumber} will be assigned automatically.`}>
          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Billing Party" required hint="The customer who pays this bill.">
              <select className="field" value={partyId} onChange={(e) => setPartyId(e.target.value)}>
                <option value="">Select party</option>
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Bill Date" required>
              <input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="TDS Section">
              <input className="field" value={tdsSection} onChange={(e) => setTdsSection(e.target.value)} />
            </Field>
            <Field label="TDS %" hint="Defaults from customer rules; override if agreed.">
              <input
                type="number"
                step="0.01"
                className="field"
                value={tdsPercent}
                onChange={(e) => setTdsPercent(e.target.value)}
              />
            </Field>
          </div>
          {partyId && (
            <div className="mt-4 rounded-2xl border-2 border-ink/12 bg-white p-4 text-sm">
              <div className="mb-2 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                Customer rule on file
              </div>
              <RuleSummary partyId={partyId} />
            </div>
          )}
        </Panel>
      )}

      {step === 1 && (
        <Panel
          title="Select received trips"
          subtitle="Only Received (Billable) trips appear here. Pending trips can never be billed."
        >
          <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <input className="field" placeholder="Search LR, route, truck, party…" value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="flex gap-2">
              <input type="date" className="field" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <input type="date" className="field" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <select className="field" value={filterParty} onChange={(e) => setFilterParty(e.target.value)}>
              <option value="">All parties</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <div className="flex items-center text-sm font-semibold text-muted-foreground">
              {selected.length} trip(s) selected
            </div>
          </div>

          {billable.length === 0 ? (
            <EmptyState
              title="No billable trips available"
              message="Mark trips as Received in the Daily Book to make them billable."
            />
          ) : (
            <TableShell>
              <thead>
                <tr>
                  <Th />
                  <Th>Date</Th>
                  <Th>Truck</Th>
                  <Th>LR No</Th>
                  <Th>Route</Th>
                  <Th>Party</Th>
                  <Th>Company</Th>
                  <Th align="right">N-Wt</Th>
                  <Th align="right">R-Wt</Th>
                  <Th align="right">Rate</Th>
                </tr>
              </thead>
              <tbody>
                {billable.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => toggle(t.id)}
                    className={cn(
                      "cursor-pointer border-t-2 border-ink/10",
                      selected.includes(t.id) ? "bg-turq/20" : "hover:bg-sun/15",
                    )}
                  >
                    <Td align="center">
                      <input type="checkbox" readOnly checked={selected.includes(t.id)} className="size-4 accent-current" />
                    </Td>
                    <Td className="font-semibold">{shortDate(t.date)}</Td>
                    <Td>{store.truckOf(t.truckId).number}</Td>
                    <Td>{t.lrNo}</Td>
                    <Td>
                      {t.from} → {t.to}
                    </Td>
                    <Td>{partyOf(t.partyId).name}</Td>
                    <Td className="text-muted-foreground">{store.companyOf(t.companyId).name}</Td>
                    <Td align="right">{tons(t.nWeight)}</Td>
                    <Td align="right">{tons(t.rWeight)}</Td>
                    <Td align="right">{money(t.customerRate)}</Td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          )}
        </Panel>
      )}

      {step === 2 && (
        <Panel title="Review selected trips" subtitle="Each row uses the rule configured for its own party.">
          <TableShell>
            <thead>
              <tr>
                <Th>Trip</Th>
                <Th>Truck</Th>
                <Th>Party</Th>
                <Th>Company</Th>
                <Th align="right">N-Wt</Th>
                <Th align="right">R-Wt</Th>
                <Th>Freight Basis</Th>
                <Th align="right">Rate</Th>
                <Th align="right">Freight</Th>
                <Th align="right">Shortage</Th>
                <Th align="right">Allowance</Th>
                <Th>Rule</Th>
                <Th align="right">Material Rate</Th>
                <Th align="right">Debit</Th>
              </tr>
            </thead>
            <tbody>
              {chosen.map((t) => {
                const party = partyOf(t.partyId);
                const c = calcTrip(t, party);
                return (
                  <tr key={t.id} className="border-t-2 border-ink/10">
                    <Td>{t.lrNo}</Td>
                    <Td>{store.truckOf(t.truckId).number}</Td>
                    <Td>{party.name}</Td>
                    <Td className="text-muted-foreground">{store.companyOf(t.companyId).name}</Td>
                    <Td align="right">{tons(t.nWeight)}</Td>
                    <Td align="right">{tons(t.rWeight)}</Td>
                    <Td>{FREIGHT_BASIS_LABEL[party.rule.freightBasis]}</Td>
                    <Td align="right">{money(t.customerRate)}</Td>
                    <Td align="right" className="font-semibold">{money(c.freight)}</Td>
                    <Td align="right">{tons(c.shortage)}</Td>
                    <Td align="right">{tons(c.allowanceQty)}</Td>
                    <Td>{SHORTAGE_RULE_LABEL[party.rule.shortageRule]}</Td>
                    <Td align="right">{money(party.rule.materialRate)}</Td>
                    <Td align="right">{money(c.shortageDebit)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </TableShell>
        </Panel>
      )}

      {step === 3 && (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Panel title="Trip-level calculation">
            <div className="space-y-3">
              {totals.lines.map(({ trip, party, calc }) => (
                <div key={trip.id} className="rounded-2xl border-2 border-ink/12 bg-white p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-semibold">
                      {trip.lrNo} · {party.name}
                    </div>
                    <Badge tone="neutral">{FREIGHT_BASIS_LABEL[party.rule.freightBasis]}</Badge>
                  </div>
                  <div className="mt-2 grid gap-1 text-[13px] text-muted-foreground sm:grid-cols-2">
                    <span>
                      Freight: {party.rule.freightBasis === "FIXED" ? "fixed per trip" : `${tons(calc.freightQty)} × ${money(trip.customerRate)}`} ={" "}
                      <span className="font-semibold text-ink">{money(calc.freight)}</span>
                    </span>
                    <span>
                      Shortage: {tons(trip.nWeight)} − {tons(trip.rWeight)} ={" "}
                      <span className="font-semibold text-ink">{tons(calc.shortage)}</span>
                    </span>
                    <span>
                      Allowance ({party.rule.allowanceType === "PERCENT" ? pct(party.rule.allowanceValue) : party.rule.allowanceType === "KG" ? `${party.rule.allowanceValue} KG` : tons(party.rule.allowanceValue)}):{" "}
                      <span className="font-semibold text-ink">{tons(calc.allowanceQty)}</span>
                    </span>
                    <span>
                      {SHORTAGE_RULE_LABEL[party.rule.shortageRule]} → applicable{" "}
                      <span className="font-semibold text-ink">{tons(calc.applicableShortage)}</span> ×{" "}
                      {money(party.rule.materialRate)} ={" "}
                      <span className="font-semibold text-ink">{money(calc.shortageDebit)}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Calculation preview">
            <div className="space-y-2 text-sm">
              <Row label="Subtotal Freight" value={money(totals.grossFreight)} />
              <Row label="Less: Shortage Debit" value={`− ${money(totals.shortageDebit)}`} />
              <Row label={`Less: TDS ${tdsSection} @ ${pct(Number(tdsPercent) || 0)}`} value={`− ${money(totals.tds)}`} />
              <div className="mt-2 flex items-center justify-between border-t-2 border-dashed border-ink/20 pt-3">
                <span className="font-semibold">Net Bill Amount</span>
                <span className="font-display text-2xl font-bold tnum">{money(totals.net)}</span>
              </div>
              <p className="pt-2 text-xs text-muted-foreground">
                TDS is calculated on gross freight, before shortage debit notes.
              </p>
            </div>
          </Panel>
        </div>
      )}

      {step === 4 && (
        <Panel title="Confirm & create bill">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border-2 border-ink/12 bg-white p-5 text-sm">
              <Row label="Firm" value={store.firm.name} />
              <Row label="Bill number" value={`#${nextNumber} (automatic)`} />
              <Row label="Bill date" value={longDate(date)} />
              <Row label="Billing party" value={partyId ? partyOf(partyId).name : "—"} />
              <Row label="Trips" value={`${chosen.length}`} />
            </div>
            <div className="rounded-2xl bg-ink p-5 text-sm text-ink-foreground">
              <Row label="Gross Freight" value={money(totals.grossFreight)} />
              <Row label="Shortage Debit" value={money(totals.shortageDebit)} />
              <Row label="TDS" value={money(totals.tds)} />
              <div className="mt-2 flex items-center justify-between border-t border-white/20 pt-3">
                <span className="font-semibold">Net Bill Amount</span>
                <span className="font-display text-2xl font-bold tnum">{money(totals.net)}</span>
              </div>
            </div>
          </div>
        </Panel>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          ← Back
        </Button>
        {step < 4 ? (
          <Button variant="coral" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
            Continue →
          </Button>
        ) : (
          <Button variant="coral" onClick={post}>
            Create Bill #{nextNumber}
          </Button>
        )}
      </div>
    </>
  );
}

function RuleSummary({ partyId }: { partyId: string }) {
  const { partyOf } = useStore();
  const r = partyOf(partyId).rule;
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      <Row label="Freight basis" value={FREIGHT_BASIS_LABEL[r.freightBasis]} />
      <Row label="Shortage debit" value={r.shortageDebit ? "Applicable" : "Not applicable"} />
      <Row label="Shortage rule" value={SHORTAGE_RULE_LABEL[r.shortageRule]} />
      <Row
        label="Allowance"
        value={
          r.allowanceType === "PERCENT"
            ? pct(r.allowanceValue)
            : r.allowanceType === "KG"
              ? `${r.allowanceValue} KG`
              : tons(r.allowanceValue)
        }
      />
      <Row label="Material rate" value={money(r.materialRate)} />
      <Row label="TDS" value={r.tdsApplicable ? `${r.tdsSection} @ ${pct(r.tdsPercent)}` : "Not applicable"} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="opacity-70">{label}</span>
      <span className="text-right font-semibold tnum">{value}</span>
    </div>
  );
}
