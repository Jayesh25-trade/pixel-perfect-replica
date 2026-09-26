import { createFileRoute } from "@tanstack/react-router";
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
import { money, longDate } from "@/lib/format";

export const Route = createFileRoute("/ledger")({
  head: () => ({
    meta: [
      { title: "Customer Ledger — Transport Books" },
      {
        name: "description",
        content:
          "Read-only Tally-style customer ledger with voucher type, debit, credit and running balance.",
      },
      { property: "og:title", content: "Customer Ledger" },
      { property: "og:description", content: "Opening balance, credits, debits and closing balance." },
    ],
  }),
  component: Ledger,
});

interface Entry {
  date: string;
  particulars: string;
  voucherType: string;
  voucherNo: string;
  debit: number;
  credit: number;
  source: string;
  narration: string;
}

function Ledger() {
  const store = useStore();
  const { parties, bills, payments, billSummary } = store;
  const [partyId, setPartyId] = useState(parties[0]?.id ?? "");
  const [voucherType, setVoucherType] = useState("");
  const [side, setSide] = useState("");
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<(Entry & { balance: number }) | null>(null);

  const party = parties.find((p) => p.id === partyId);

  const entries = useMemo<Entry[]>(() => {
    if (!party) return [];
    const list: Entry[] = [];
    bills
      .filter((b) => b.partyId === party.id)
      .forEach((b) => {
        const s = billSummary(b);
        list.push({
          date: b.date,
          particulars: "Transportation Charges - RCM",
          voucherType: "Journal",
          voucherNo: `BILL-${b.number}`,
          debit: 0,
          credit: s.gross,
          source: `Bill #${b.number}`,
          narration: `Gross freight billed on ${longDate(b.date)}`,
        });
        if (s.shortage > 0) {
          list.push({
            date: b.date,
            particulars: "Transportation Charges - RCM",
            voucherType: "Debit Note",
            voucherNo: `DN-${b.number}`,
            debit: s.shortage,
            credit: 0,
            source: `Bill #${b.number}`,
            narration: "Shortage debit note valued at material rate",
          });
        }
        if (s.tds > 0) {
          list.push({
            date: b.date,
            particulars: `TDS on Contract ${b.tdsSection.replace("194", "94")}`,
            voucherType: "Journal",
            voucherNo: `TDS-${b.number}`,
            debit: s.tds,
            credit: 0,
            source: `Bill #${b.number}`,
            narration: `TDS withheld on gross freight`,
          });
        }
      });
    payments
      .filter((p) => p.partyId === party.id)
      .forEach((p) => {
        list.push({
          date: p.date,
          particulars: p.kind === "ADVANCE" ? "Customer Payment (Advance)" : "Customer Payment",
          voucherType: "Receipt",
          voucherNo: p.reference ?? p.mode,
          debit: p.amount,
          credit: 0,
          source: p.mode,
          narration: p.narration ?? "",
        });
      });
    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [party, bills, payments, billSummary]);

  const withBalance = useMemo(() => {
    let bal = party?.openingBalance ?? 0;
    return entries.map((e) => {
      bal = +(bal + e.credit - e.debit).toFixed(2);
      return { ...e, balance: bal };
    });
  }, [entries, party]);

  const rows = withBalance
    .filter((e) => (voucherType ? e.voucherType === voucherType : true))
    .filter((e) => (side === "DEBIT" ? e.debit > 0 : side === "CREDIT" ? e.credit > 0 : true))
    .filter((e) =>
      q ? `${e.particulars} ${e.voucherNo} ${e.narration}`.toLowerCase().includes(q.toLowerCase()) : true,
    );

  const totalCredits = entries.reduce((s, e) => s + e.credit, 0);
  const totalDebits = entries.reduce((s, e) => s + e.debit, 0);
  const closing = (party?.openingBalance ?? 0) + totalCredits - totalDebits;

  return (
    <>
      <PageHeader
        eyebrow="Accounts"
        title="Customer Ledger"
        description="Read-only accounting view. Running balance = opening balance + credits − debits."
      />

      <Panel className="mb-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Party">
            <select className="field" value={partyId} onChange={(e) => setPartyId(e.target.value)}>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Voucher type">
            <select className="field" value={voucherType} onChange={(e) => setVoucherType(e.target.value)}>
              <option value="">All voucher types</option>
              <option value="Journal">Journal</option>
              <option value="Debit Note">Debit Note</option>
              <option value="Receipt">Receipt</option>
            </select>
          </Field>
          <Field label="Debit / Credit">
            <select className="field" value={side} onChange={(e) => setSide(e.target.value)}>
              <option value="">Both sides</option>
              <option value="DEBIT">Debit only</option>
              <option value="CREDIT">Credit only</option>
            </select>
          </Field>
          <Field label="Search">
            <input className="field" placeholder="Voucher no, particulars…" value={q} onChange={(e) => setQ(e.target.value)} />
          </Field>
        </div>
      </Panel>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Summary label="Opening balance" value={money(party?.openingBalance ?? 0)} />
        <Summary label="Total credits" value={money(totalCredits)} />
        <Summary label="Total debits" value={money(totalDebits)} />
        <Summary label="Closing / outstanding" value={money(closing)} highlight />
      </div>

      <Panel title={party?.name ?? "Ledger"} subtitle={`${rows.length} transactions`}>
        {rows.length === 0 ? (
          <EmptyState title="No ledger transactions" message="Post a bill or record a payment to see entries here." />
        ) : (
          <TableShell>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Particulars</Th>
                <Th>Voucher Type</Th>
                <Th>Voucher No</Th>
                <Th align="right">Debit</Th>
                <Th align="right">Credit</Th>
                <Th align="right">Running Balance</Th>
                <Th align="center">Details</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e, i) => (
                <tr key={i} className="border-t-2 border-ink/10 hover:bg-sun/15">
                  <Td className="font-semibold">{longDate(e.date)}</Td>
                  <Td>{e.particulars}</Td>
                  <Td>
                    <Badge tone={e.voucherType === "Receipt" ? "received" : e.voucherType === "Debit Note" ? "warn" : "neutral"}>
                      {e.voucherType}
                    </Badge>
                  </Td>
                  <Td>{e.voucherNo}</Td>
                  <Td align="right">{e.debit ? money(e.debit) : "—"}</Td>
                  <Td align="right">{e.credit ? money(e.credit) : "—"}</Td>
                  <Td align="right" className="font-semibold">
                    {money(e.balance)}
                  </Td>
                  <Td align="center">
                    <button
                      onClick={() => setDetail(e)}
                      className="rounded-full border-2 border-ink px-3 py-1 text-xs font-semibold hover:bg-ink hover:text-ink-foreground"
                    >
                      View
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </Panel>

      {detail && party && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-3xl border-2 border-ink bg-card p-6 shadow-flat">
            <div className="text-[11px] font-semibold tracking-[0.2em] text-coral uppercase">Transaction</div>
            <h3 className="font-display mb-4 text-2xl font-bold">{detail.particulars}</h3>
            <dl className="grid gap-2 text-sm">
              <Row label="Party" value={party.name} />
              <Row label="Date" value={longDate(detail.date)} />
              <Row label="Voucher type" value={detail.voucherType} />
              <Row label="Voucher number" value={detail.voucherNo} />
              <Row label="Amount" value={money(detail.debit || detail.credit)} />
              <Row label="Side" value={detail.debit ? "Debit" : "Credit"} />
              <Row label="Source entity" value={detail.source} />
              <Row label="Balance after" value={money(detail.balance)} />
              <Row label="Narration" value={detail.narration || "—"} />
            </dl>
            <div className="mt-5 flex justify-end">
              <Button variant="ink" onClick={() => setDetail(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Summary({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={highlight ? "rounded-3xl bg-ink p-5 text-ink-foreground" : "rounded-3xl border-2 border-ink bg-card p-5"}>
      <div className="text-[10px] font-semibold tracking-[0.18em] uppercase opacity-60">{label}</div>
      <div className="font-display mt-1 text-2xl font-bold tnum">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-ink/10 py-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold tnum">{value}</dd>
    </div>
  );
}
