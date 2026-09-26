import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { EmptyState, Field, PageHeader, Panel, TableShell, Td, Th } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import { money, daysBetween } from "@/lib/format";
import { AGING_BUCKETS, bucketFor } from "@/lib/calc";

export const Route = createFileRoute("/reports/aging")({
  head: () => ({
    meta: [
      { title: "Aging Analysis — Transport Books" },
      {
        name: "description",
        content:
          "Party-wise aging of outstanding receivables across current, 1-30, 31-60, 61-90, 91-180 and 181+ day buckets.",
      },
      { property: "og:title", content: "Aging Analysis" },
      { property: "og:description", content: "Receivables aged against a selectable as-of date." },
    ],
  }),
  component: Aging,
});

function Aging() {
  const store = useStore();
  const { bills, billSummary, partyOf } = store;
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0, 10));

  const rows = useMemo(() => {
    const byParty = new Map<
      string,
      { name: string; bills: number; buckets: Record<string, number>; total: number }
    >();
    bills.forEach((b) => {
      const s = billSummary(b);
      if (s.outstanding <= 0) return;
      const key = bucketFor(daysBetween(b.date, asOf));
      const party = partyOf(b.partyId);
      const entry =
        byParty.get(party.id) ??
        {
          name: party.name,
          bills: 0,
          buckets: Object.fromEntries(AGING_BUCKETS.map((x) => [x.key, 0])),
          total: 0,
        };
      entry.bills += 1;
      entry.buckets[key] = +(entry.buckets[key] + s.outstanding).toFixed(2);
      entry.total = +(entry.total + s.outstanding).toFixed(2);
      byParty.set(party.id, entry);
    });
    return [...byParty.values()].sort((a, b) => b.total - a.total);
  }, [bills, billSummary, partyOf, asOf]);

  const totals = AGING_BUCKETS.map((b) => ({
    ...b,
    amount: rows.reduce((s, r) => s + r.buckets[b.key], 0),
  }));
  const grand = rows.reduce((s, r) => s + r.total, 0);

  return (
    <>
      <PageHeader
        eyebrow="Reports"
        title="Aging Analysis"
        description="Partly paid bills age only their remaining outstanding. Buckets reconcile to total outstanding."
      />

      <Panel className="mb-6">
        <div className="max-w-xs">
          <Field label="As of date">
            <input type="date" className="field" value={asOf} onChange={(e) => setAsOf(e.target.value)} />
          </Field>
        </div>
      </Panel>

      <Panel title="Party-wise aging" subtitle={`Total outstanding ${money(grand)}`}>
        {rows.length === 0 ? (
          <EmptyState title="Nothing to age" message="There is no outstanding receivable as of this date." />
        ) : (
          <TableShell>
            <thead>
              <tr>
                <Th>Party</Th>
                <Th align="right">Bills</Th>
                {AGING_BUCKETS.map((b) => (
                  <Th key={b.key} align="right">
                    {b.label}
                  </Th>
                ))}
                <Th align="right">Total Outstanding</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name} className="border-t-2 border-ink/10 hover:bg-sun/15">
                  <Td className="font-semibold">{r.name}</Td>
                  <Td align="right">{r.bills}</Td>
                  {AGING_BUCKETS.map((b) => (
                    <Td key={b.key} align="right">
                      {r.buckets[b.key] ? money(r.buckets[b.key]) : "—"}
                    </Td>
                  ))}
                  <Td align="right" className="font-semibold">
                    {money(r.total)}
                  </Td>
                </tr>
              ))}
              <tr className="border-t-2 border-ink bg-ink text-ink-foreground">
                <Td className="font-semibold">Total</Td>
                <Td align="right">{rows.reduce((s, r) => s + r.bills, 0)}</Td>
                {totals.map((b) => (
                  <Td key={b.key} align="right" className="font-semibold">
                    {money(b.amount)}
                  </Td>
                ))}
                <Td align="right" className="font-semibold">
                  {money(grand)}
                </Td>
              </tr>
            </tbody>
          </TableShell>
        )}
      </Panel>
    </>
  );
}
