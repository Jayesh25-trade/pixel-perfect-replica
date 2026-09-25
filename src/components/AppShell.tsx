import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV: { to: string; label: string; icon: string; group?: string }[] = [
  { to: "/", label: "Dashboard", icon: "📊" },
  { to: "/daily-book", label: "Daily Book", icon: "📒", group: "Operations" },
  { to: "/driver-vouchers", label: "Driver Vouchers", icon: "🚚", group: "Operations" },
  { to: "/bills", label: "Bills", icon: "🧾", group: "Accounts" },
  { to: "/bills/create", label: "Create Bill", icon: "➕", group: "Accounts" },
  { to: "/payments", label: "Payments", icon: "💳", group: "Accounts" },
  { to: "/ledger", label: "Ledger", icon: "📖", group: "Accounts" },
  { to: "/masters", label: "Masters", icon: "🗂️", group: "Setup" },
  { to: "/reports/outstanding", label: "Outstanding", icon: "📌", group: "Reports" },
  { to: "/reports/aging", label: "Aging Analysis", icon: "⏳", group: "Reports" },
  { to: "/settings", label: "Settings", icon: "⚙️", group: "Setup" },
];

function FirmSwitcher({ compact }: { compact?: boolean }) {
  const { firms, firm, setFirmId } = useStore();
  return (
    <div className={cn("rounded-2xl bg-white/6 p-1.5", compact && "flex gap-1.5")}>
      {!compact && (
        <div className="px-2 pt-1 pb-1.5 text-[10px] font-semibold tracking-[0.2em] text-ink-foreground/45 uppercase">
          Active firm
        </div>
      )}
      <div className={cn("flex gap-1.5", !compact && "flex-col")}>
        {firms.map((f) => (
          <button
            key={f.id}
            onClick={() => setFirmId(f.id)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[12px] font-semibold transition-colors",
              f.id === firm.id
                ? "bg-coral text-coral-foreground"
                : "text-ink-foreground/55 hover:bg-white/8 hover:text-ink-foreground",
            )}
          >
            <span
              className={cn(
                "grid size-5 shrink-0 place-items-center rounded-md text-[9px] font-bold",
                f.id === firm.id ? "bg-white/25" : "bg-white/10",
              )}
            >
              {f.short}
            </span>
            {f.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  let lastGroup: string | undefined;
  return (
    <nav className="flex flex-col gap-1 text-[13px] font-medium">
      {NAV.map((item) => {
        const showGroup = item.group && item.group !== lastGroup;
        lastGroup = item.group;
        const active =
          item.to === "/" ? pathname === "/" : pathname === item.to;
        return (
          <div key={item.to}>
            {showGroup && (
              <div className="mt-4 mb-1.5 px-3.5 text-[10px] font-semibold tracking-[0.2em] text-ink-foreground/35 uppercase">
                {item.group}
              </div>
            )}
            <Link
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 transition-colors",
                active
                  ? "bg-coral font-semibold text-coral-foreground"
                  : "text-ink-foreground/65 hover:bg-white/6 hover:text-ink-foreground",
              )}
            >
              <span aria-hidden>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          </div>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { firm } = useStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col gap-5 overflow-y-auto bg-ink p-5 text-ink-foreground lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="font-display grid size-10 place-items-center rounded-2xl bg-coral text-xl font-bold text-coral-foreground">
            {firm.short}
          </div>
          <div>
            <div className="font-display text-lg leading-none font-bold">{firm.name.split(" ")[0]}</div>
            <div className="mt-0.5 text-[10px] tracking-[0.2em] text-ink-foreground/50 uppercase">
              Transport Books
            </div>
          </div>
        </div>
        <FirmSwitcher />
        <NavList />
        <div className="mt-auto rounded-3xl bg-white/6 p-4">
          <div className="text-[10px] tracking-[0.18em] text-ink-foreground/45 uppercase">
            Working in
          </div>
          <div className="font-display mt-1 text-xl font-bold">{firm.name}</div>
          <div className="mt-1 text-[11px] text-ink-foreground/55">GSTIN {firm.gstin}</div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between gap-3 bg-ink px-4 py-3 text-ink-foreground lg:hidden">
        <div className="flex items-center gap-2">
          <div className="font-display grid size-8 place-items-center rounded-xl bg-coral text-sm font-bold text-coral-foreground">
            {firm.short}
          </div>
          <div className="text-sm font-semibold">{firm.name}</div>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-full border-2 border-white/20 px-3 py-1.5 text-xs font-semibold"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open && (
        <div className="sticky top-[56px] z-30 max-h-[70vh] overflow-y-auto bg-ink px-4 pb-5 text-ink-foreground lg:hidden">
          <FirmSwitcher compact />
          <div className="mt-3">
            <NavList onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <main className="mx-auto max-w-[1320px] px-4 py-6 md:px-8 md:py-8 lg:ml-[248px]">
        {children}
      </main>
    </div>
  );
}
