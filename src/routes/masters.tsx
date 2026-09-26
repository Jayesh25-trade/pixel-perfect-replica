import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, PageHeader, Panel, TableShell, Td, Th } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import { money, pct, tons } from "@/lib/format";
import { FREIGHT_BASIS_LABEL, SHORTAGE_RULE_LABEL } from "@/lib/calc";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/masters")({
  head: () => ({
    meta: [
      { title: "Masters — Transport Books" },
      {
        name: "description",
        content:
          "Parties, companies, trucks, locations and per-customer billing rules for freight, shortage and TDS.",
      },
      { property: "og:title", content: "Masters" },
      { property: "og:description", content: "Parties, companies, trucks and customer rules." },
    ],
  }),
  component: Masters,
});

const TABS = ["Parties", "Companies", "Trucks", "Locations", "Customer Rules"] as const;

function Masters() {
  const store = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Parties");
  const locations = Array.from(
    new Set(store.trips.flatMap((t) => [t.from, t.to]).filter(Boolean)),
  ).sort();

  return (
    <>
      <PageHeader
        eyebrow="Setup"
        title="Masters"
        description="Party is the billing customer. Company is the loading site. They are different records."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              tab === t ? "bg-coral text-coral-foreground" : "border-2 border-ink/15 bg-white hover:bg-sun/25",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Parties" && (
        <Panel title="Parties (Billing Customers)" subtitle="Who receives the bill and pays it.">
          <TableShell>
            <thead>
              <tr>
                <Th>Party</Th>
                <Th>GSTIN</Th>
                <Th>City</Th>
                <Th>Freight basis</Th>
                <Th align="right">Freight rate</Th>
                <Th align="right">Opening balance</Th>
              </tr>
            </thead>
            <tbody>
              {store.parties.map((p) => (
                <tr key={p.id} className="border-t-2 border-ink/10 hover:bg-sun/15">
                  <Td className="font-semibold">{p.name}</Td>
                  <Td>{p.gstin}</Td>
                  <Td>{p.city}</Td>
                  <Td>{FREIGHT_BASIS_LABEL[p.rule.freightBasis]}</Td>
                  <Td align="right">{money(p.rule.freightRate)}</Td>
                  <Td align="right">{money(p.openingBalance)}</Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </Panel>
      )}

      {tab === "Companies" && (
        <Panel title="Companies (Loading Sites)" subtitle="Dispatch / material locations. Not the billing customer.">
          <TableShell>
            <thead>
              <tr>
                <Th>Company</Th>
                <Th>Site</Th>
                <Th align="right">Trips recorded</Th>
              </tr>
            </thead>
            <tbody>
              {store.companies.map((c) => (
                <tr key={c.id} className="border-t-2 border-ink/10 hover:bg-sun/15">
                  <Td className="font-semibold">{c.name}</Td>
                  <Td>{c.site}</Td>
                  <Td align="right">{store.trips.filter((t) => t.companyId === c.id).length}</Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </Panel>
      )}

      {tab === "Trucks" && (
        <Panel title="Trucks">
          <TableShell>
            <thead>
              <tr>
                <Th>Truck No</Th>
                <Th>Ownership</Th>
                <Th>Driver</Th>
                <Th align="right">Trips recorded</Th>
              </tr>
            </thead>
            <tbody>
              {store.trucks.map((t) => (
                <tr key={t.id} className="border-t-2 border-ink/10 hover:bg-sun/15">
                  <Td className="font-semibold">{t.number}</Td>
                  <Td>
                    <Badge tone={t.ownership === "Own" ? "received" : "neutral"}>{t.ownership}</Badge>
                  </Td>
                  <Td>{t.driver}</Td>
                  <Td align="right">{store.trips.filter((x) => x.truckId === t.id).length}</Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </Panel>
      )}

      {tab === "Locations" && (
        <Panel title="Locations" subtitle="Collected from loading and unloading points used in the Daily Book.">
          <div className="flex flex-wrap gap-2">
            {locations.map((l) => (
              <Badge key={l} tone="neutral">
                {l}
              </Badge>
            ))}
          </div>
        </Panel>
      )}

      {tab === "Customer Rules" && (
        <Panel
          title="Customer Rules"
          subtitle="Material rate values shortage debit only — it is never the freight rate."
        >
          <TableShell>
            <thead>
              <tr>
                <Th>Party</Th>
                <Th>Freight basis</Th>
                <Th align="right">Freight rate</Th>
                <Th align="center">Shortage debit</Th>
                <Th>Shortage rule</Th>
                <Th align="right">Allowance</Th>
                <Th align="right">Material rate</Th>
                <Th align="center">TDS</Th>
              </tr>
            </thead>
            <tbody>
              {store.parties.map((p) => {
                const r = p.rule;
                return (
                  <tr key={p.id} className="border-t-2 border-ink/10 hover:bg-sun/15">
                    <Td className="font-semibold">{p.name}</Td>
                    <Td>{FREIGHT_BASIS_LABEL[r.freightBasis]}</Td>
                    <Td align="right">{money(r.freightRate)}</Td>
                    <Td align="center">
                      <Badge tone={r.shortageDebit ? "received" : "neutral"}>
                        {r.shortageDebit ? "Applicable" : "Not applicable"}
                      </Badge>
                    </Td>
                    <Td>{SHORTAGE_RULE_LABEL[r.shortageRule]}</Td>
                    <Td align="right">
                      {r.allowanceType === "PERCENT"
                        ? pct(r.allowanceValue)
                        : r.allowanceType === "KG"
                          ? `${r.allowanceValue} KG`
                          : tons(r.allowanceValue)}
                    </Td>
                    <Td align="right">{money(r.materialRate)}</Td>
                    <Td align="center">
                      {r.tdsApplicable ? `${r.tdsSection} @ ${pct(r.tdsPercent)}` : "Not applicable"}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableShell>
        </Panel>
      )}
    </>
  );
}
