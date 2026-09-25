import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { KpiCard, Panel, StatusBadge, TableShell, Td, Th, Button, Badge } from "@/components/ui-kit";
import { PageHeader } from "@/components/ui-kit";
import { useStore, unallocatedAdvance } from "@/lib/store";
import { money, money0, shortDate, tons, longDate, daysBetween } from "@/lib/format";
import { AGING_BUCKETS, bucketFor } from "@/lib/calc";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Transport Books" },
      {
        name: "description",
        content:
          "Management summary of outstanding, net billed revenue, receipts, aging and daily book trips.",
      },
      { property: "og:title", content: "Dashboard — Transport Books" },
      {
        property: "og:description",
        content: "Outstanding, billed revenue, receipts and aging at a glance.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const store = useStore();
  const { firm, bills, trips, payments, billSummary, parties } = store;
  const today = new Date().toISOString().slice(0, 10);

  const summaries = useMemo(
    () => bills.map((b) => ({ bill: b, s: billSummary(b) })),
    [bills, billSummary],
  );

  const totalOutstanding = summaries.reduce((s, x) => s + x.s.outstanding, 0);
  const netBilled = summaries.reduce((s, x) => s + x.s.net, 0);
  const gross = summaries.reduce((s, x) => s + x.s.gross, 0);
  const shortage = summaries.reduce((s, x) => s + x.s.shortage, 0);
  const tds = summaries.reduce((s, x) => s + x.s.tds, 0);
  const receipts = payments.reduce((s, p) => s + p.amount, 0);
  const againstBill = payments
    .filter((p) => p.kind === "AGAINST_BILL")
    .reduce((s, p) => s + p.amount, 0);
  const advances = payments
    .filter((p) => p.kind === "ADVANCE")
    .reduce((s, p) => s + p.amount, 0);
  const unallocated = parties.reduce(
    (s, p) => s + unallocatedAdvance(p.id, payments),
    0,
  );

  const aging = AGING_BUCKETS.map((b) => ({
    ...b,
    amount: summaries
      .filter((x) => x.s.outstanding > 0)
      .filter((x) => bucketFor(daysBetween(x.bill.date, today)) === b.key)
      .reduce((s, x) => s + x.s.outstanding, 0),
  }));
  const agingMax = Math.max(1, ...aging.map((a) => a.amount));

  const voucher = trips.reduce(
    (acc, t) => ({
      advance: acc.advance + t.advance,
      cash: acc.cash + t.cash,
      diesel: acc.diesel + t.diesel,
      account: acc.account + t.account,
    }),
    { advance: 0, cash: 0, diesel: 0, account: 0 },
  );
  const voucherTotal = voucher.advance + voucher.cash + voucher.diesel + voucher.account;

  const recentTrips = [...trips].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  return (
    <>
      <PageHeader
        eyebrow={`${longDate(today)} · ${firm.name}`}
        title={
          <>
            Books for <span className="text-coral">{firm.name}</span>
          </>
        }
        description="Management summary. All figures below belong only to the active firm."
        actions={
          <>
            <Link to="/daily-book">
              <Button variant="ink">📒 Add trip</Button>
            </Link>
            <Link to="/bills/create">
              <Button variant="coral">🧾 Create bill</Button>
            </Link>
          </>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          tone="coral"
          label="Total Outstanding"
          value={money0(totalOutstanding)}
          hint={`${summaries.filter((x) => x.s.outstanding > 0).length} open bills`}
        />
        <KpiCard tone="ink" label="Net Billed Revenue" value={money0(netBilled)} hint={`${bills.length} bills posted`} />
        <KpiCard tone="sun" label="Payment Receipts" value={money0(receipts)} hint={`${payments.length} receipts`} />
        <KpiCard label="Daily Book Trips" value={String(trips.length)} hint={`${trips.filter((t) => t.status === "RECEIVED").length} received · ${trips.filter((t) => t.status === "PENDING").length} pending`} />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <Panel title="Billing breakdown">
          <dl className="space-y-3 text-sm">
            <Row label="Gross Freight" value={money(gross)} />
            <Row label="Less: Shortage Debit Notes" value={`− ${money(shortage)}`} />
            <Row label="Less: TDS Withheld" value={`− ${money(tds)}`} />
            <div className="flex items-center justify-between border-t-2 border-dashed border-ink/20 pt-3">
              <dt className="font-semibold">Net Bill Amount</dt>
              <dd className="font-display text-xl font-bold tnum">{money(netBilled)}</dd>
            </div>
          </dl>
        </Panel>

        <Panel title="Payments">
          <dl className="space-y-3 text-sm">
            <Row label="Total Received" value={money(receipts)} />
            <Row label="Against-Bill Payments" value={money(againstBill)} />
            <Row label="Advance Payments" value={money(advances)} />
            <div className="flex items-center justify-between rounded-2xl bg-sun/35 px-4 py-3">
              <dt className="text-sm font-semibold">Unallocated advances</dt>
              <dd className="font-semibold tnum">{money(unallocated)}</dd>
            </div>
            <p className="text-xs text-muted-foreground">
              Unallocated advances are never netted against bill outstanding.
            </p>
          </dl>
        </Panel>

        <Panel title="Aging" subtitle="Outstanding by age of bill">
          <div className="space-y-3">
            {aging.map((b) => (
              <div key={b.key}>
                <div className="mb-1 flex items-center justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">{b.label}</span>
                  <span className="tnum">{money0(b.amount)}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-ink/10">
                  <div
                    className="h-full rounded-full bg-coral"
                    style={{ width: `${(b.amount / agingMax) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel
        className="mb-8"
        title={
          <>
            Daily Book — <span className="text-coral">Roznamcha</span>
          </>
        }
        subtitle="Latest trips entered for this firm."
        action={
          <Link to="/daily-book">
            <Button variant="turq">Open Daily Book</Button>
          </Link>
        }
      >
        <TableShell>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Truck</Th>
              <Th>Route</Th>
              <Th align="right">N-Weight</Th>
              <Th align="right">R-Weight</Th>
              <Th>Party (Billing Customer)</Th>
              <Th>Company (Loading Site)</Th>
              <Th align="right">Rate</Th>
              <Th align="center">Status</Th>
            </tr>
          </thead>
          <tbody>
            {recentTrips.map((t) => (
              <tr key={t.id} className="border-t-2 border-ink/10 hover:bg-sun/15">
                <Td className="font-semibold">{shortDate(t.date)}</Td>
                <Td>
                  <Badge tone="neutral">{store.truckOf(t.truckId).number}</Badge>
                </Td>
                <Td>
                  {t.from} → {t.to}
                </Td>
                <Td align="right">{tons(t.nWeight)}</Td>
                <Td align="right">{tons(t.rWeight)}</Td>
                <Td>{store.partyOf(t.partyId).name}</Td>
                <Td className="text-muted-foreground">{store.companyOf(t.companyId).name}</Td>
                <Td align="right">{money0(t.customerRate)}</Td>
                <Td align="center">
                  <StatusBadge status={t.status} />
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </Panel>

      <Panel
        title="Driver voucher summary"
        subtitle="Operational Voucher — Accounting Treatment Pending Confirmation"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MiniStat label="Advance" value={money0(voucher.advance)} />
          <MiniStat label="Cash" value={money0(voucher.cash)} />
          <MiniStat label="Diesel" value={money0(voucher.diesel)} />
          <MiniStat label="A/c" value={money0(voucher.account)} />
          <MiniStat label="Total operational" value={money0(voucherTotal)} highlight />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          These amounts are not posted to the accounting ledger. Status:{" "}
          <span className="font-semibold text-ink">PENDING CONFIRMATION</span>.
        </p>
      </Panel>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold tnum">{value}</dd>
    </div>
  );
}

function MiniStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-2xl bg-ink px-4 py-3 text-ink-foreground"
          : "rounded-2xl border-2 border-ink/12 bg-white px-4 py-3"
      }
    >
      <div className="text-[10px] font-semibold tracking-[0.18em] uppercase opacity-60">{label}</div>
      <div className="font-display mt-1 text-xl font-bold tnum">{value}</div>
    </div>
  );
}
