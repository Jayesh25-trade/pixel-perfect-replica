import { createFileRoute } from "@tanstack/react-router";
import { Badge, EmptyState, PageHeader, Panel, TableShell, Td, Th } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import { money0, shortDate } from "@/lib/format";

export const Route = createFileRoute("/driver-vouchers")({
  head: () => ({
    meta: [
      { title: "Driver Vouchers — Transport Books" },
      {
        name: "description",
        content:
          "Operational driver vouchers synced from the Daily Book: advance, cash, diesel and account amounts.",
      },
      { property: "og:title", content: "Driver Vouchers" },
      { property: "og:description", content: "Advance, cash, diesel and A/c per trip." },
    ],
  }),
  component: DriverVouchers,
});

function DriverVouchers() {
  const store = useStore();
  const rows = [...store.trips].sort((a, b) => b.date.localeCompare(a.date));
  const total = (t: (typeof rows)[number]) => t.advance + t.cash + t.diesel + t.account;
  const grand = rows.reduce((s, t) => s + total(t), 0);

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Driver Vouchers"
        description="Synchronised from the Daily Book. These amounts are operational records only."
      />

      <div className="mb-6 rounded-3xl border-2 border-ink bg-sun/40 px-5 py-4">
        <div className="font-display text-lg font-bold">
          Operational Voucher — Accounting Treatment Pending Confirmation
        </div>
        <p className="mt-1 text-sm text-ink/70">
          Nothing on this page is posted to the accounting ledger. Status:{" "}
          <span className="font-semibold">PENDING CONFIRMATION</span>.
        </p>
      </div>

      <Panel title="Vouchers" subtitle={`${rows.length} trips · total operational ${money0(grand)}`}>
        {rows.length === 0 ? (
          <EmptyState
            title="No driver vouchers yet"
            message="Vouchers appear automatically as you record trips in the Daily Book."
          />
        ) : (
          <TableShell>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Truck</Th>
                <Th>Driver</Th>
                <Th>LR No</Th>
                <Th>Route</Th>
                <Th align="right">Advance</Th>
                <Th align="right">Cash</Th>
                <Th align="right">Diesel</Th>
                <Th align="right">A/c</Th>
                <Th align="right">Total</Th>
                <Th align="center">Accounting</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-t-2 border-ink/10 hover:bg-sun/15">
                  <Td className="font-semibold">{shortDate(t.date)}</Td>
                  <Td>
                    <Badge tone="neutral">{store.truckOf(t.truckId).number}</Badge>
                  </Td>
                  <Td>{store.truckOf(t.truckId).driver}</Td>
                  <Td>{t.lrNo}</Td>
                  <Td>
                    {t.from} → {t.to}
                  </Td>
                  <Td align="right">{money0(t.advance)}</Td>
                  <Td align="right">{money0(t.cash)}</Td>
                  <Td align="right">{money0(t.diesel)}</Td>
                  <Td align="right">{money0(t.account)}</Td>
                  <Td align="right" className="font-semibold">
                    {money0(total(t))}
                  </Td>
                  <Td align="center">
                    <Badge tone="pending">Pending confirmation</Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </Panel>
    </>
  );
}
