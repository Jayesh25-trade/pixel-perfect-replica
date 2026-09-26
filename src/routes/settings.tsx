import { createFileRoute } from "@tanstack/react-router";
import { Badge, PageHeader, Panel } from "@/components/ui-kit";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Transport Books" },
      {
        name: "description",
        content: "Firm configuration, user management, database backup and audit log.",
      },
      { property: "og:title", content: "Settings" },
      { property: "og:description", content: "Firm configuration and administration." },
    ],
  }),
  component: Settings,
});

function Settings() {
  const { firms, firm } = useStore();

  return (
    <>
      <PageHeader
        eyebrow="Setup"
        title="Settings"
        description="Each firm keeps its own books. Switch firms from the sidebar at any time."
      />

      <Panel className="mb-6" title="Firm configuration">
        <div className="grid gap-4 md:grid-cols-2">
          {firms.map((f) => (
            <div
              key={f.id}
              className={
                f.id === firm.id
                  ? "rounded-3xl border-2 border-ink bg-sun/35 p-5"
                  : "rounded-3xl border-2 border-ink/15 bg-white p-5"
              }
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-xl font-bold">{f.name}</h3>
                {f.id === firm.id && <Badge tone="posted">Active firm</Badge>}
              </div>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">GSTIN</dt>
                  <dd className="font-semibold">{f.gstin}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Place of business</dt>
                  <dd className="font-semibold">{f.place}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-6 md:grid-cols-3">
        <ComingSoon
          title="User Management"
          message="Roles and per-user access for operators and accountants."
        />
        <ComingSoon
          title="Database Backup"
          message="Scheduled and on-demand backups with restore history."
        />
        <ComingSoon
          title="Audit Log"
          message="Who changed what, when — including payment reversals and corrections."
        />
      </div>
    </>
  );
}

function ComingSoon({ title, message }: { title: string; message: string }) {
  return (
    <Panel>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-bold">{title}</h3>
        <Badge tone="pending">Not available yet</Badge>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      <button
        disabled
        className="mt-4 cursor-not-allowed rounded-full border-2 border-ink/20 px-4 py-2 text-sm font-semibold text-muted-foreground"
      >
        Coming soon
      </button>
    </Panel>
  );
}
