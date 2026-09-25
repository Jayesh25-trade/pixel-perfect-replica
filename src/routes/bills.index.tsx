import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Button,
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
  TableShell,
  Td,
  Th,
} from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import { money, longDate, tons, pct } from "@/lib/format";
import { calcTrip, FREIGHT_BASIS_LABEL, SHORTAGE_RULE_LABEL } from "@/lib/calc";
import type { Bill } from "@/lib/types";

export const Route = createFileRoute("/bills/")({
  head: () => ({
    meta: [
      { title: "Bills — Transport Books" },
      {
        name: "description",
        content:
          "Customer bills with gross freight, shortage debit notes, TDS, net amount and payment status.",
      },
      { property: "og:title", content: "Bills" },
      { property: "og:description", content: "Posted customer bills and their outstanding." },
    ],
  }),
  component: Bills,
});

function Bills() {
  const store = useStore();
  const { bills, billSummary, partyOf } = store;
  const [open, setOpen] = useState<Bill | null>(null);

  return (
    <>
      <PageHeader
        eyebrow="Accounts"
        title="Bills"
        description="Every bill can carry trips from several parties, each resolved on its own customer rule."
        actions={
          <Link to="/bills/create">
            <Button variant="coral">🧾 Create bill</Button>
          </Link>
        }
      />

      <Panel title="Posted bills" subtitle={`${bills.length} bills for this firm`}>
        {bills.length === 0 ? (
          <EmptyState
            title="No bills generated yet"
            message="Create your first customer bill from received trips."
            action={
              <Link to="/bills/create">
                <Button variant="coral">Create bill</Button>
              </Link>
            }
          />
        ) : (
          <TableShell>
            <thead>
              <tr>
                <Th>Bill No</Th>
                <Th>Date</Th>
                <Th>Billing Party</Th>
                <Th align="right">Gross Freight</Th>
                <Th align="right">Shortage Debit</Th>
                <Th align="right">TDS</Th>
                <Th align="right">Net Bill</Th>
                <Th align="right">Received</Th>
                <Th align="right">Outstanding</Th>
                <Th align="center">Status</Th>
                <Th align="center">Action</Th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => {
                const s = billSummary(b);
                return (
                  <tr key={b.id} className="border-t-2 border-ink/10 hover:bg-sun/15">
                    <Td className="font-semibold">#{b.number}</Td>
                    <Td>{longDate(b.date)}</Td>
                    <Td>{partyOf(b.partyId).name}</Td>
                    <Td align="right">{money(s.gross)}</Td>
                    <Td align="right">{money(s.shortage)}</Td>
                    <Td align="right">{money(s.tds)}</Td>
                    <Td align="right" className="font-semibold">
                      {money(s.net)}
                    </Td>
                    <Td align="right">{money(s.received)}</Td>
                    <Td align="right">{money(s.outstanding)}</Td>
                    <Td align="center">
                      <StatusBadge status={s.status} />
                    </Td>
                    <Td align="center">
                      <button
                        onClick={() => setOpen(b)}
                        className="rounded-full border-2 border-ink px-3 py-1 text-xs font-semibold hover:bg-ink hover:text-ink-foreground"
                      >
                        View
                      </button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableShell>
        )}
      </Panel>

      {open && <BillModal bill={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function BillModal({ bill, onClose }: { bill: Bill; onClose: () => void }) {
  const store = useStore();
  const s = store.billSummary(bill);
  const trips = store.trips.filter((t) => bill.tripIds.includes(t.id));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-3 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl border-2 border-ink bg-card p-6 shadow-flat">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold tracking-[0.2em] text-coral uppercase">
              {store.firm.name}
            </div>
            <h3 className="font-display text-3xl font-bold">Bill #{bill.number}</h3>
            <p className="text-sm text-muted-foreground">
              {longDate(bill.date)} · {store.partyOf(bill.partyId).name} · TDS {bill.tdsSection} @{" "}
              {pct(bill.tdsPercent)}
            </p>
          </div>
          <StatusBadge status={s.status} />
        </div>

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
            {trips.map((t) => {
              const party = store.partyOf(t.partyId);
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
                  <Td align="right" className="font-semibold">
                    {money(c.freight)}
                  </Td>
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

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border-2 border-ink/12 bg-white p-5 text-sm">
            <Line label="Gross Freight" value={money(s.gross)} />
            <Line label="Less: Shortage Debit" value={`− ${money(s.shortage)}`} />
            <Line label={`Less: TDS ${bill.tdsSection} @ ${pct(bill.tdsPercent)}`} value={`− ${money(s.tds)}`} />
            <div className="mt-2 flex items-center justify-between border-t-2 border-dashed border-ink/20 pt-3">
              <span className="font-semibold">Net Bill Amount</span>
              <span className="font-display text-xl font-bold tnum">{money(s.net)}</span>
            </div>
          </div>
          <div className="rounded-2xl bg-ink p-5 text-sm text-ink-foreground">
            <Line label="Received" value={money(s.received)} />
            <Line label="Outstanding" value={money(s.outstanding)} />
            <p className="mt-3 text-xs opacity-60">
              Shortage = N-Weight − R-Weight, valued at the material rate. TDS is computed on gross
              freight.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <Button variant="outline" onClick={() => window.print()}>
            Print / PDF
          </Button>
          <Button variant="ink" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="opacity-70">{label}</span>
      <span className="font-semibold tnum">{value}</span>
    </div>
  );
}
