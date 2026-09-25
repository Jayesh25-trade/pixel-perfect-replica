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
import { useStore, unallocatedAdvance } from "@/lib/store";
import { money, longDate } from "@/lib/format";
import type { PaymentKind, PaymentMode } from "@/lib/types";

export const Route = createFileRoute("/payments")({
  head: () => ({
    meta: [
      { title: "Payments — Transport Books" },
      {
        name: "description",
        content:
          "Record against-bill receipts and advances, and allocate unapplied advances to specific bills.",
      },
      { property: "og:title", content: "Payments" },
      { property: "og:description", content: "Receipts, advances and controlled allocation." },
    ],
  }),
  component: Payments,
});

const MODES: { value: PaymentMode; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "BANK", label: "Bank account" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "NEFT", label: "NEFT" },
  { value: "RTGS", label: "RTGS" },
  { value: "UPI", label: "UPI" },
];

function Payments() {
  const store = useStore();
  const { payments, parties, bills, billSummary, partyOf, addPayment, allocateAdvance } = store;

  const [partyId, setPartyId] = useState("");
  const [kind, setKind] = useState<PaymentKind>("AGAINST_BILL");
  const [billId, setBillId] = useState("");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<PaymentMode>("NEFT");
  const [bankName, setBankName] = useState("");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  const [allocFor, setAllocFor] = useState<string | null>(null);

  const openBills = useMemo(
    () => bills.filter((b) => billSummary(b).outstanding > 0),
    [bills, billSummary],
  );
  const partyBills = openBills.filter((b) => !partyId || b.partyId === partyId);

  const advanceRows = payments
    .filter((p) => p.kind === "ADVANCE")
    .map((p) => ({
      p,
      pending: +(p.amount - p.allocations.reduce((s, a) => s + a.amount, 0)).toFixed(2),
    }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!partyId || !amt) {
      setError("Party and amount are required.");
      return;
    }
    if (kind === "AGAINST_BILL" && !billId) {
      setError("Choose the bill this payment settles.");
      return;
    }
    addPayment({
      date,
      partyId,
      kind,
      amount: amt,
      mode,
      bankName: bankName || undefined,
      reference: reference || undefined,
      allocations: kind === "AGAINST_BILL" ? [{ billId, amount: amt }] : [],
      narration: kind === "ADVANCE" ? "Advance received" : "Payment against bill",
    });
    setAmount("");
    setReference("");
    setBankName("");
    setBillId("");
    setError("");
  }

  return (
    <>
      <PageHeader
        eyebrow="Accounts"
        title="Payments"
        description="Against-bill receipts settle a specific bill. Advances stay unallocated until you apply them."
      />

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <Panel title="Record payment">
          <form onSubmit={submit} className="grid gap-4">
            <Field label="Party (Billing Customer)" required>
              <select className="field" value={partyId} onChange={(e) => setPartyId(e.target.value)}>
                <option value="">Select party</option>
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Payment type" required>
              <select className="field" value={kind} onChange={(e) => setKind(e.target.value as PaymentKind)}>
                <option value="AGAINST_BILL">Against bill</option>
                <option value="ADVANCE">Advance payment</option>
              </select>
            </Field>
            {kind === "AGAINST_BILL" && (
              <Field label="Bill" required hint="Only bills with outstanding are listed.">
                <select className="field" value={billId} onChange={(e) => setBillId(e.target.value)}>
                  <option value="">Select bill</option>
                  {partyBills.map((b) => (
                    <option key={b.id} value={b.id}>
                      #{b.number} · {partyOf(b.partyId).name} · outstanding {money(billSummary(b).outstanding)}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Date" required>
              <input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Amount (₹)" required>
              <input type="number" className="field" placeholder="50000" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
            <Field label="Mode" required>
              <select className="field" value={mode} onChange={(e) => setMode(e.target.value as PaymentMode)}>
                {MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </Field>
            {(mode === "BANK" || mode === "CHEQUE" || mode === "NEFT" || mode === "RTGS") && (
              <Field label="Bank name" required={mode === "CHEQUE"}>
                <input className="field" placeholder="HDFC Bank" value={bankName} onChange={(e) => setBankName(e.target.value)} />
              </Field>
            )}
            <Field
              label={
                mode === "CHEQUE"
                  ? "Cheque number"
                  : mode === "UPI"
                    ? "UPI transaction / UTR"
                    : mode === "CASH"
                      ? "Reference (optional)"
                      : "Reference / UTR"
              }
              required={mode !== "CASH"}
            >
              <input className="field" placeholder="UTR-9928114" value={reference} onChange={(e) => setReference(e.target.value)} />
            </Field>
            {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
            <Button type="submit" variant="coral">
              Save payment
            </Button>
          </form>
        </Panel>

        <div className="grid gap-6">
          <Panel title="Unallocated advances" subtitle="Kept strictly separate from bill outstanding.">
            {advanceRows.filter((r) => r.pending > 0).length === 0 ? (
              <EmptyState title="No unallocated advances" message="Advances you record appear here until you allocate them to a bill." />
            ) : (
              <div className="grid gap-3">
                {advanceRows
                  .filter((r) => r.pending > 0)
                  .map(({ p, pending }) => (
                    <div key={p.id} className="rounded-2xl border-2 border-ink/12 bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold">{partyOf(p.partyId).name}</div>
                          <div className="text-xs text-muted-foreground">
                            {longDate(p.date)} · {p.mode} {p.reference ? `· ${p.reference}` : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge tone="pending">Unallocated {money(pending)}</Badge>
                          <Button variant="ink" onClick={() => setAllocFor(p.id)}>
                            Allocate advance
                          </Button>
                        </div>
                      </div>
                      {allocFor === p.id && (
                        <AllocateForm
                          paymentId={p.id}
                          partyId={p.partyId}
                          pending={pending}
                          onDone={() => setAllocFor(null)}
                          allocate={allocateAdvance}
                        />
                      )}
                    </div>
                  ))}
              </div>
            )}
          </Panel>

          <Panel title="Payment history" subtitle={`${payments.length} receipts`}>
            {payments.length === 0 ? (
              <EmptyState title="No payments recorded" message="Record your first receipt from the form on the left." />
            ) : (
              <TableShell>
                <thead>
                  <tr>
                    <Th>Date</Th>
                    <Th>Party</Th>
                    <Th>Type</Th>
                    <Th>Mode</Th>
                    <Th>Reference</Th>
                    <Th align="right">Amount</Th>
                    <Th>Allocated to</Th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-t-2 border-ink/10 hover:bg-sun/15">
                      <Td className="font-semibold">{longDate(p.date)}</Td>
                      <Td>{partyOf(p.partyId).name}</Td>
                      <Td>
                        <Badge tone={p.kind === "ADVANCE" ? "pending" : "received"}>
                          {p.kind === "ADVANCE" ? "Advance" : "Against bill"}
                        </Badge>
                      </Td>
                      <Td>{p.mode}</Td>
                      <Td className="text-muted-foreground">{p.reference ?? "—"}</Td>
                      <Td align="right" className="font-semibold">
                        {money(p.amount)}
                      </Td>
                      <Td>
                        {p.allocations.length === 0
                          ? "Unallocated"
                          : p.allocations
                              .map((a) => {
                                const b = bills.find((x) => x.id === a.billId);
                                return `#${b?.number ?? "?"} ${money(a.amount)}`;
                              })
                              .join(", ")}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Payments are never deleted. Corrections are made through a reversal entry with a reason and
              audit trail.
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}

function AllocateForm({
  paymentId,
  partyId,
  pending,
  onDone,
  allocate,
}: {
  paymentId: string;
  partyId: string;
  pending: number;
  onDone: () => void;
  allocate: (paymentId: string, billId: string, amount: number) => void;
}) {
  const { bills, billSummary, partyOf } = useStore();
  const options = bills.filter((b) => b.partyId === partyId && billSummary(b).outstanding > 0);
  const [billId, setBillId] = useState(options[0]?.id ?? "");
  const [amount, setAmount] = useState(String(pending));

  return (
    <div className="mt-4 grid gap-3 rounded-2xl bg-sun/25 p-4 sm:grid-cols-[1fr_180px_auto_auto]">
      <Field label="Allocate to bill">
        <select className="field" value={billId} onChange={(e) => setBillId(e.target.value)}>
          {options.map((b) => (
            <option key={b.id} value={b.id}>
              Bill #{b.number} · {partyOf(b.partyId).name} · outstanding {money(billSummary(b).outstanding)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Amount (₹)">
        <input type="number" className="field" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </Field>
      <div className="flex items-end">
        <Button
          variant="coral"
          disabled={!billId || !Number(amount) || Number(amount) > pending}
          onClick={() => {
            allocate(paymentId, billId, Number(amount));
            onDone();
          }}
        >
          Allocate
        </Button>
      </div>
      <div className="flex items-end">
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
      </div>
      {options.length === 0 && (
        <p className="text-sm text-muted-foreground sm:col-span-4">
          This party has no bill with outstanding to allocate against.
        </p>
      )}
    </div>
  );
}
