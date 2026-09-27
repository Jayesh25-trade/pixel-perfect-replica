import type { ReactNode } from "react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { money, money0, tons, kg } from "@/lib/format";

/* ---------------------------------------------------------------- Panel */

export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("card-flat p-4 sm:p-5 md:p-6", className)}>
      {(title || action) && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h2 className="font-display text-lg leading-tight font-bold sm:text-xl md:text-2xl">
                {title}
              </h2>
            )}
            {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

/** A labelled group of inputs inside a form. */
export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border-2 border-ink/12 bg-white p-4 sm:p-5", className)}>
      <div className="mb-4">
        <div className="text-[11px] font-semibold tracking-[0.18em] text-coral uppercase">
          {title}
        </div>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- Badges */

type Tone = "received" | "pending" | "paid" | "partial" | "posted" | "neutral" | "warn";

const toneClass: Record<Tone, string> = {
  received: "bg-turq/35 text-ink border-turq",
  paid: "bg-turq/35 text-ink border-turq",
  pending: "bg-sun/50 text-ink border-sun",
  partial: "bg-blue/15 text-ink border-blue/50",
  posted: "bg-ink text-ink-foreground border-ink",
  warn: "bg-rose/30 text-ink border-rose",
  neutral: "bg-ink/8 text-ink border-ink/20",
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
        "inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const STATUS_MAP: Record<string, { tone: Tone; label: string; dot: string }> = {
  RECEIVED: { tone: "received", label: "Received · Billable", dot: "bg-turq" },
  PENDING: { tone: "pending", label: "Pending · Unbillable", dot: "bg-sun" },
  POSTED: { tone: "posted", label: "Posted", dot: "bg-ink-foreground" },
  PARTIALLY_PAID: { tone: "partial", label: "Partially paid", dot: "bg-blue" },
  PAID: { tone: "paid", label: "Paid", dot: "bg-turq" },
};

export function StatusBadge({ status, compact }: { status: string; compact?: boolean }) {
  const m = STATUS_MAP[status] ?? { tone: "neutral" as Tone, label: status, dot: "bg-ink/40" };
  const label = compact ? (m.label.split(" · ")[0] ?? m.label) : m.label;
  return (
    <Badge tone={m.tone}>
      <span className={cn("size-1.5 rounded-full", m.dot)} />
      {label}
    </Badge>
  );
}

/** Voucher-type badge used by the ledger. */
export function VoucherBadge({ type }: { type: string }) {
  const tone: Tone =
    type === "Receipt" ? "received" : type === "Debit Note" ? "warn" : "neutral";
  return <Badge tone={tone}>{type}</Badge>;
}

/* --------------------------------------------------------------- Buttons */

export function Button({
  variant = "ink",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "ink" | "coral" | "turq" | "outline" | "ghost";
  size?: "sm" | "md";
}) {
  const variants = {
    ink: "bg-ink text-ink-foreground border-2 border-ink hover:bg-ink/88",
    coral: "bg-coral text-coral-foreground border-2 border-coral hover:brightness-95",
    turq: "bg-turq text-ink border-2 border-ink hover:brightness-95",
    outline: "border-2 border-ink bg-transparent text-ink hover:bg-ink/6",
    ghost: "border-2 border-transparent text-ink hover:bg-ink/6",
  } as const;
  const sizes = {
    sm: "px-3.5 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
  } as const;
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-150",
        "active:translate-y-px disabled:pointer-events-none disabled:opacity-40",
        variants[variant],
        sizes[size],
        className,
      )}
    />
  );
}

/* ------------------------------------------------------------ Numbers */

/** Money with tabular figures and optional sign framing. */
export function MoneyDisplay({
  value,
  compact,
  signed,
  size = "md",
  className,
}: {
  value: number;
  /** Drop paise for dense rows. */
  compact?: boolean;
  /** Render as a deduction: "− ₹5,600". */
  signed?: "minus" | "plus";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "font-display text-xl font-bold",
    xl: "font-display text-2xl font-bold sm:text-3xl",
  } as const;
  const text = compact ? money0(value) : money(value);
  return (
    <span className={cn("tnum whitespace-nowrap", sizes[size], className)}>
      {signed === "minus" ? "− " : signed === "plus" ? "+ " : ""}
      {text}
    </span>
  );
}

/** Weight in tonnes (40.000 T) or kilograms (150 KG). */
export function WeightDisplay({
  value,
  unit = "T",
  className,
}: {
  value: number;
  unit?: "T" | "KG";
  className?: string;
}) {
  return (
    <span className={cn("tnum whitespace-nowrap", className)}>
      {unit === "KG" ? kg(value) : tons(value)}
    </span>
  );
}

/* ------------------------------------------------------------ KPI cards */

export function KpiCard({
  label,
  value,
  hint,
  tone = "outline",
  icon,
  footer,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "ink" | "coral" | "sun" | "turq" | "outline";
  icon?: ReactNode;
  footer?: ReactNode;
}) {
  const tones = {
    ink: "bg-ink text-ink-foreground border-ink",
    coral: "bg-coral text-coral-foreground border-coral",
    sun: "bg-sun text-ink border-ink",
    turq: "bg-turq text-ink border-ink",
    outline: "bg-card border-ink",
  } as const;
  const hintTone = {
    ink: "text-ink-foreground/65",
    coral: "text-coral-foreground/85",
    sun: "text-ink/70",
    turq: "text-ink/70",
    outline: "text-muted-foreground",
  } as const;
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-3xl border-2 p-4 shadow-flat-sm transition-transform duration-150 hover:-translate-y-0.5 sm:p-5",
        tones[tone],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "text-[10px] font-semibold tracking-[0.18em] uppercase sm:text-[11px]",
            hintTone[tone],
          )}
        >
          {label}
        </div>
        {icon && <span className="text-lg leading-none">{icon}</span>}
      </div>
      <div className="font-display tnum mt-2 text-2xl leading-none font-bold sm:text-3xl">
        {value}
      </div>
      {hint && <div className={cn("mt-1.5 text-xs font-medium sm:text-sm", hintTone[tone])}>{hint}</div>}
      {footer && <div className="mt-3">{footer}</div>}
    </div>
  );
}

/** Smaller secondary metric tile for operational counts. */
export function StatTile({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "coral" | "turq" | "sun" | "ink";
}) {
  const bar = {
    coral: "bg-coral",
    turq: "bg-turq",
    sun: "bg-sun",
    ink: "bg-ink",
  } as const;
  return (
    <div className="card-inset flex items-center gap-3 px-4 py-3">
      <span className={cn("h-9 w-1.5 shrink-0 rounded-full", bar[accent ?? "ink"])} />
      <div className="min-w-0">
        <div className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          {label}
        </div>
        <div className="font-display tnum text-lg leading-tight font-bold">{value}</div>
        {hint && <div className="truncate text-xs text-muted-foreground">{hint}</div>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Tables */

export function TableShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "-mx-1 overflow-x-auto rounded-2xl border-2 border-ink px-0 sm:mx-0",
        className,
      )}
    >
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
        "bg-ink px-3 py-3 text-[10px] font-semibold tracking-[0.12em] text-ink-foreground uppercase whitespace-nowrap",
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
        align === "right" && "tnum text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  );
}

/** Standard body row styling so every table hovers identically. */
export const rowClass = "border-t-2 border-ink/10 hover:bg-sun/20";

/* ------------------------------------------------------------- Feedback */

export function EmptyState({
  title,
  message,
  action,
  icon,
}: {
  title: string;
  message: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-ink/25 bg-white/50 px-6 py-12 text-center sm:py-14">
      {icon && <div className="mb-3 text-3xl">{icon}</div>}
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
  className,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
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
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-7 sm:gap-5">
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-2 text-[10px] font-semibold tracking-[0.22em] text-coral uppercase sm:text-[11px]">
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-3xl leading-[0.98] font-bold sm:text-4xl md:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-[15px]">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:gap-3">{actions}</div>}
    </header>
  );
}

/* ------------------------------------------------------------ Stepper */

export function StepIndicator({
  steps,
  current,
  onStepClick,
}: {
  steps: readonly string[];
  current: number;
  onStepClick?: (index: number) => void;
}) {
  const pctDone = (current / Math.max(1, steps.length - 1)) * 100;
  return (
    <div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-ink/10">
        <div
          className="h-full rounded-full bg-coral transition-all duration-300"
          style={{ width: `${pctDone}%` }}
        />
      </div>
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {steps.map((s, i) => {
          const done = i < current;
          const active = i === current;
          const clickable = Boolean(onStepClick) && i <= current;
          return (
            <li key={s}>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick?.(i)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-2xl border-2 px-3 py-2 text-left transition-colors duration-150",
                  active && "border-ink bg-ink text-ink-foreground",
                  done && "border-turq bg-turq/25 text-ink",
                  !active && !done && "border-ink/12 bg-white text-ink/40",
                  clickable && !active && "hover:border-ink/40",
                )}
              >
                <span
                  className={cn(
                    "font-display grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold",
                    active && "bg-coral text-coral-foreground",
                    done && "bg-turq text-ink",
                    !active && !done && "bg-ink/10 text-ink/50",
                  )}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span className="truncate text-xs font-semibold sm:text-sm">{s}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* -------------------------------------------------------------- Modal */

export function Modal({
  title,
  eyebrow,
  badge,
  subtitle,
  onClose,
  children,
  footer,
  wide,
}: {
  title: ReactNode;
  eyebrow?: string;
  badge?: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 duration-150 animate-in fade-in sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border-2 border-ink bg-card p-4 shadow-flat duration-200 animate-in slide-in-from-bottom-4 sm:rounded-3xl sm:p-6",
          wide ? "max-w-4xl" : "max-w-2xl",
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow && (
              <div className="text-[10px] font-semibold tracking-[0.2em] text-coral uppercase">
                {eyebrow}
              </div>
            )}
            <h3 className="font-display text-xl leading-tight font-bold sm:text-2xl">{title}</h3>
            {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {badge}
            <button
              onClick={onClose}
              aria-label="Close"
              className="grid size-8 place-items-center rounded-full border-2 border-ink/20 text-sm font-bold transition-colors hover:bg-ink hover:text-ink-foreground"
            >
              ✕
            </button>
          </div>
        </div>
        {children}
        {footer && <div className="mt-5 flex flex-wrap justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

/** Label/value tile used inside modals and detail panels. */
export function DetailTile({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className={cn("card-inset px-4 py-3", emphasis && "border-ink bg-sun/25")}>
      <div className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </div>
      <div className="tnum mt-0.5 text-sm font-semibold break-words">{value}</div>
    </div>
  );
}

/** A line in a running calculation (gross → deductions → net). */
export function CalcRow({
  label,
  value,
  note,
  deduction,
  total,
}: {
  label: string;
  value: number;
  note?: string;
  deduction?: boolean;
  total?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4 py-2",
        total && "mt-1 border-t-2 border-dashed border-ink/25 pt-3",
      )}
    >
      <div className="min-w-0">
        <div className={cn("text-sm", total ? "font-display text-base font-bold" : "font-medium")}>
          {label}
        </div>
        {note && <div className="text-xs text-muted-foreground">{note}</div>}
      </div>
      <MoneyDisplay
        value={value}
        signed={deduction ? "minus" : undefined}
        size={total ? "lg" : "md"}
        className={cn(deduction && "text-coral", total && "text-ink")}
      />
    </div>
  );
}
