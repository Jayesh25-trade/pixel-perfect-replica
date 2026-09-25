import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("card-flat p-5 md:p-6", className)}>
      {(title || action) && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="font-display text-xl font-bold md:text-2xl">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

type Tone = "received" | "pending" | "paid" | "partial" | "posted" | "neutral" | "warn";

const toneClass: Record<Tone, string> = {
  received: "bg-turq/30 text-ink",
  paid: "bg-turq/30 text-ink",
  pending: "bg-sun/45 text-ink",
  partial: "bg-blue/20 text-ink",
  posted: "bg-ink text-ink-foreground",
  warn: "bg-rose/30 text-ink",
  neutral: "bg-ink/10 text-ink",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { tone: Tone; label: string }> = {
    RECEIVED: { tone: "received", label: "Received · Billable" },
    PENDING: { tone: "pending", label: "Pending · Unbillable" },
    POSTED: { tone: "posted", label: "Posted" },
    PARTIALLY_PAID: { tone: "partial", label: "Partially paid" },
    PAID: { tone: "paid", label: "Paid" },
  };
  const m = map[status] ?? { tone: "neutral" as Tone, label: status };
  return <Badge tone={m.tone}>{m.label}</Badge>;
}

export function Button({
  variant = "ink",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "ink" | "coral" | "turq" | "outline";
}) {
  const variants = {
    ink: "bg-ink text-ink-foreground hover:bg-ink/85",
    coral: "bg-coral text-coral-foreground hover:bg-coral/90",
    turq: "bg-turq text-ink hover:bg-turq/85",
    outline: "border-2 border-ink bg-transparent text-ink hover:bg-ink/5",
  } as const;
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        variants[variant],
        className,
      )}
    />
  );
}

export function KpiCard({
  label,
  value,
  hint,
  tone = "outline",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "ink" | "coral" | "sun" | "outline";
}) {
  const tones = {
    ink: "bg-ink text-ink-foreground",
    coral: "bg-coral text-coral-foreground",
    sun: "bg-sun text-ink",
    outline: "bg-card border-2 border-ink",
  } as const;
  const hintTone = {
    ink: "text-ink-foreground/65",
    coral: "text-coral-foreground/80",
    sun: "text-ink/70",
    outline: "text-muted-foreground",
  } as const;
  return (
    <div className={cn("rounded-3xl p-5 md:p-6", tones[tone])}>
      <div className={cn("text-[11px] font-semibold tracking-[0.18em] uppercase", hintTone[tone])}>
        {label}
      </div>
      <div className="font-display mt-2 text-3xl font-bold tnum">{value}</div>
      {hint && <div className={cn("mt-1 text-sm font-medium", hintTone[tone])}>{hint}</div>}
    </div>
  );
}

export function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border-2 border-ink">
      <table className="w-full min-w-max text-sm">{children}</table>
    </div>
  );
}

export function Th({
  children,
  align = "left",
  className,
}: {
  children?: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  return (
    <th
      className={cn(
        "bg-ink px-3 py-3 text-[11px] font-semibold tracking-[0.12em] text-ink-foreground uppercase whitespace-nowrap",
        align === "right" && "text-right",
        align === "center" && "text-center",
        align === "left" && "text-left",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = "left",
  className,
}: {
  children?: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  return (
    <td
      className={cn(
        "px-3 py-2.5 align-middle whitespace-nowrap",
        align === "right" && "text-right tnum",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-ink/25 px-6 py-14 text-center">
      <div className="font-display text-lg font-bold">{title}</div>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="field-label">
        {label}
        {required && <span className="text-coral"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-5">
      <div>
        {eyebrow && (
          <div className="mb-2 text-[11px] font-semibold tracking-[0.22em] text-coral uppercase">
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-4xl leading-[0.95] font-bold md:text-5xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[15px] text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}
