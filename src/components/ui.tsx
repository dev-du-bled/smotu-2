import { useCallback, useEffect, useRef, useState } from "react";
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

export function Shell({
  children,
  className,
  themeId,
}: BaseProps & { themeId?: string }) {
  return (
    <main
      className={cn("min-h-dvh bg-background text-foreground", className)}
      data-smotu-theme={themeId}
    >
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

// Menu déroulant générique, accessible : ferme au clic extérieur et à Escape.
export function Dropdown({
  align = "left",
  children,
  className,
  trigger,
  triggerClassName,
}: {
  align?: "left" | "right";
  children: ReactNode | ((close: () => void) => ReactNode);
  className?: string;
  trigger: ReactNode | ((open: boolean) => ReactNode);
  triggerClassName?: string | ((open: boolean) => string);
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const container = containerRef.current;

      if (!container || container.contains(event.target as Node)) {
        return;
      }

      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className={
          typeof triggerClassName === "function"
            ? triggerClassName(open)
            : triggerClassName
        }
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        {typeof trigger === "function" ? trigger(open) : trigger}
      </button>

      {open ? (
        <div
          className={cn(
            "absolute top-full z-20 mt-2 rounded-lg border border-input bg-card p-1 shadow-xl",
            // Entrée ancrée au déclencheur : scale depuis l'origine du trigger,
            // jamais depuis le centre. Sortie instantanée (les menus se ferment sec).
            "transition-[opacity,scale] duration-150 ease-(--ease-out-strong) starting:opacity-0 motion-safe:starting:scale-95",
            align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left",
            className,
          )}
          role="menu"
        >
          {typeof children === "function" ? children(close) : children}
        </div>
      ) : null}
    </div>
  );
}

// Fenêtre modale générique, centrée : ferme à Escape et au clic sur l'overlay.
export function Modal({
  children,
  footer,
  onClose,
  open,
  title,
}: {
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  open: boolean;
  title: string;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 transition-opacity duration-200 starting:opacity-0"
      style={{ background: "var(--overlay)" }}
      onClick={onClose}
    >
      {/* Une modale scale depuis le centre : elle n'est ancrée à aucun trigger. */}
      <div
        aria-modal="true"
        className="flex max-h-[85dvh] w-full max-w-2xl flex-col rounded-lg border border-border bg-card shadow-xl transition-[opacity,scale] duration-200 ease-(--ease-out-strong) starting:opacity-0 motion-safe:starting:scale-[0.97]"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-border p-4">
          <h2 className="text-lg font-black">{title}</h2>
          <button
            aria-label="Fermer"
            className="relative grid size-8 shrink-0 place-items-center rounded-md text-subtle-foreground transition-[background-color,scale] active:scale-[0.96] hover:bg-muted after:absolute after:-inset-1.5"
            type="button"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto p-4">{children}</div>
        {footer ? (
          <div className="border-t border-border p-4">{footer}</div>
        ) : null}
      </div>
    </div>
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
        "inline-flex items-center justify-center rounded-md font-bold uppercase tracking-wide transition enabled:active:scale-[0.96] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-strong hover:cursor-pointer",
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
        // Pas de transition de couleur : le feedback du jeu doit rester sec.
        // Seul le press a un retour tactile.
        "grid h-12 min-w-8 place-items-center rounded px-2 text-xs font-black uppercase transition-[scale] duration-100 active:scale-[0.96] sm:min-w-10",
        stateClass,
      )}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function RankMedal({ children, index }: BaseProps & { index: number }) {
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
