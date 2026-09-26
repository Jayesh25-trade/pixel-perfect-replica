import { createFileRoute } from "@tanstack/react-router";
import { EmptyState, PageHeader, Panel, StatusBadge, TableShell, Td, Th } from "@/components/ui-kit";
import { useStore, unallocatedAdvance } from "@/lib/store";
import { money, longDate } from "@/lib/format";

export const Route = createFileRoute("/reports/outstanding")({
  head: () => ({
    meta: [
      { title: "Outstanding Report — Transport Books" },
      {
        name: "description",
        content:
          "Bill-wise outstanding with gross, shortage, TDS, net, received and status, plus unallocated advances.",
      },
      { property: "og:title", content: "Outstanding Report" },
      { property: "og:description", content: "Bill-wise receivables for the active firm." },
    ],
  }),
  component: Outstanding,
});

function Outstanding() {
  const store = useStore();
  const { bills, billSummary, partyOf, parties, payments } = store;
  const rows = bills.map((b) => ({ bill: b, s: billSummary(b) }));
  const total = rows.reduce((s, r) => s + r.s.outstanding, 0);
  const advances = parties
    .map((p) => ({ party: p, amount: unallocatedAdvance(p.id, payments) }))
    .filter((a) => a.amount > 0);

  return (
    <>
      <PageHeader
        eyebrow="Reports"
        title="Outstanding"
        description="Read-only. Unallocated advances are reported separately and never netted off bills."
      />

      <Panel className="mb-6" title="Bill-wise outstanding" subtitle={`Total outstanding ${money(total)}`}>
        {rows.length === 0 ? (
          <EmptyState title="Nothing outstanding" message="Bills you post will appear here with their balance." />
        ) : (
          <TableShell>
            <thead>
              <tr>
                <Th>Party</Th>
                <Th>Bill No</Th>
                <Th>Bill Date</Th>
                <Th align="right">Gross</Th>
                <Th align="right">Shortage</Th>
                <Th align="right">TDS</Th>
                <Th align="right">Net Bill</Th>
                <Th align="right">Received</Th>
                <Th align="right">Outstanding</Th>
                <Th align="center">Status</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ bill, s }) => (
                <tr key={bill.id} className="border-t-2 border-ink/10 hover:bg-sun/15">
                  <Td className="font-semibold">{partyOf(bill.partyId).name}</Td>
                  <Td>#{bill.number}</Td>
                  <Td>{longDate(bill.date)}</Td>
                  <Td align="right">{money(s.gross)}</Td>
                  <Td align="right">{money(s.shortage)}</Td>
                  <Td align="right">{money(s.tds)}</Td>
                  <Td align="right">{money(s.net)}</Td>
                  <Td align="right">{money(s.received)}</Td>
                  <Td align="right" className="font-semibold">
                    {money(s.outstanding)}
                  </Td>
                  <Td align="center">
                    <StatusBadge status={s.status} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </Panel>

      <Panel title="Unallocated advances" subtitle="Money received but not applied to any bill.">
        {advances.length === 0 ? (
          <EmptyState title="No unallocated advances" message="Advances appear here until you allocate them in Payments." />
        ) : (
          <TableShell>
            <thead>
              <tr>
                <Th>Party</Th>
                <Th align="right">Unallocated advance</Th>
              </tr>
            </thead>
            <tbody>
              {advances.map((a) => (
                <tr key={a.party.id} className="border-t-2 border-ink/10">
                  <Td className="font-semibold">{a.party.name}</Td>
                  <Td align="right">{money(a.amount)}</Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </Panel>
    </>
  );
}
