import type { ComponentProps, ReactNode } from "react";
import { cn } from "../lib/utils";
import type { TileState } from "../../shared/game";

type BaseProps = {
  children?: ReactNode;
  className?: string;
};

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "success"
  | "warning"
  | "destructive";
type ButtonSize = "sm" | "md" | "lg";

function formatCompactNumber(value: number | string): string {
  const numberValue =
    typeof value === "number" ? value : Number.parseFloat(value.replace(/\s/g, ""));

  if (!Number.isFinite(numberValue)) {
    return String(value);
  }

  const sign = numberValue < 0 ? "-" : "";
  const absoluteValue = Math.abs(numberValue);
  const units = [
    { limit: 1_000_000_000, suffix: "B" },
    { limit: 1_000_000, suffix: "M" },
    { limit: 1_000, suffix: "k" },
  ];
  const unitIndex = units.findIndex((item) => absoluteValue >= item.limit);
  const unit = units[unitIndex];

  if (!unit) {
    return `${numberValue}`;
  }

  const compactValue = absoluteValue / unit.limit;
  const precision = compactValue >= 10 || Number.isInteger(compactValue) ? 0 : 1;
  const roundedValue = Number(compactValue.toFixed(precision));

  if (roundedValue >= 1_000 && unitIndex > 0) {
    return formatCompactNumber(`${sign}${roundedValue * unit.limit}`);
  }

  return `${sign}${roundedValue}${unit.suffix}`;
}

export function Shell({ children, className }: BaseProps) {
  return (
    <main className={cn("min-h-dvh bg-background text-foreground", className)}>
      {children}
    </main>
  );
}

export function Surface({ children, className }: BaseProps) {
  return (
    <section className={cn("min-h-dvh", className)}>
      {children}
    </section>
  );
}

export function Panel({ children, className }: BaseProps) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border bg-card p-4",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Button({
  children,
  className,
  size = "md",
  variant = "primary",
  ...props
}: ComponentProps<"button"> & {
  size?: ButtonSize;
  variant?: ButtonVariant;
}) {
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-primary text-primary-foreground hover:bg-primary",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary-hover",
    ghost: "bg-transparent text-subtle-foreground hover:bg-muted",
    success: "bg-success text-success-foreground hover:bg-success-hover",
    warning: "bg-warning text-warning-foreground hover:bg-warning-hover",
    destructive:
      "bg-destructive text-destructive-foreground hover:bg-destructive",
  };
  const sizes: Record<ButtonSize, string> = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-5 text-base",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-bold uppercase tracking-wide transition disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-strong hover:cursor-pointer",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-12 min-w-0 rounded-md border border-input bg-background px-4 font-mono text-lg font-bold uppercase text-foreground outline-none placeholder:text-muted-strong focus:border-ring",
        className,
      )}
      {...props}
    />
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative grid size-10 place-items-center overflow-hidden rounded-md border-2 border-orange/70 bg-success text-sm font-black text-success-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)]",
        className,
      )}
    >
      <span className="relative text-2xl">S</span>
    </div>
  );
}

export function PointsAmount({
  className,
  iconClassName,
  valueClassName,
  value,
}: {
  className?: string;
  iconClassName?: string;
  valueClassName?: string;
  value: number | string;
}) {
  const displayValue = formatCompactNumber(value);

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-1.5 leading-none",
        className,
      )}
    >
      <img
        alt=""
        aria-hidden="true"
        className={cn("block size-5 shrink-0", iconClassName)}
        src="/smotucoin.svg"
      />
      <span
        className={cn(
          "inline-grid min-w-[1ch] translate-y-[0.055em] place-items-center font-mono leading-none tabular-nums",
          valueClassName,
        )}
      >
        {displayValue}
      </span>
    </span>
  );
}

export function SectionKicker({ children, className }: BaseProps) {
  return (
    <p
      className={cn(
        "text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex animate-pulse rounded-md bg-muted", className)}
    />
  );
}

export function ProgressStrip({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-success transition-[width]"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function WordTile({
  active,
  children,
  pending,
  size = "md",
  state,
}: BaseProps & {
  active?: boolean;
  pending?: boolean;
  size?: "sm" | "md";
  state?: TileState;
}) {
  let stateClass = "border-input bg-transparent text-foreground";

  if (pending) {
    stateClass = "border-ring bg-muted text-foreground";
  } else if (state === "correct") {
    stateClass = "border-success bg-success text-success-foreground";
  } else if (state === "present") {
    stateClass = "border-warning bg-warning text-warning-foreground";
  } else if (state === "absent") {
    stateClass = "border-input bg-secondary text-secondary-foreground";
  } else if (active) {
    stateClass = "border-muted-strong bg-transparent text-foreground";
  }

  const textClass =
    size === "sm"
      ? "text-sm sm:text-base"
      : "text-[1.65rem] sm:text-[2rem]";

  return (
    <div
      className={cn(
        "grid aspect-square overflow-hidden border-2",
        stateClass,
      )}
    >
      <span
        className={cn(
          "grid size-full place-items-center font-black uppercase leading-none",
          textClass,
        )}
      >
        {children}
      </span>
    </div>
  );
}

export function KeyCap({
  children,
  onClick,
  state,
}: BaseProps & {
  onClick?: () => void;
  state?: TileState;
}) {
  let stateClass = "bg-muted-foreground text-success-foreground";

  if (state === "correct") {
    stateClass = "bg-success text-success-foreground";
  } else if (state === "present") {
    stateClass = "bg-warning text-warning-foreground";
  } else if (state === "absent") {
    stateClass = "bg-secondary text-secondary-foreground";
  }

  return (
    <button
      className={cn(
        "grid h-12 min-w-8 place-items-center rounded px-2 text-xs font-black uppercase sm:min-w-10",
        stateClass,
      )}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function RankMedal({ children, index }: BaseProps & { index: number }) {
  const colorClass =
    index === 0
      ? "bg-success text-success-foreground"
      : index === 1
        ? "bg-warning text-warning-foreground"
        : index === 2
          ? "bg-secondary text-secondary-foreground"
          : "bg-muted text-foreground";

  return (
    <span
      className={cn(
        "grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-black",
        colorClass,
      )}
    >
      {children}
    </span>
  );
}
