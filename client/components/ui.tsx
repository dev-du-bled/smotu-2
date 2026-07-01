import type {
  ButtonHTMLAttributes,
  ComponentChildren,
  InputHTMLAttributes,
} from "preact";
import { cn } from "../lib/utils";

type BaseProps = {
  children?: ComponentChildren;
  className?: string;
};

type Variant = "primary" | "secondary" | "ghost" | "success" | "warning";
type Size = "sm" | "md" | "lg";

export function Shell({ children, className }: BaseProps) {
  return (
    <main className={cn("min-h-screen bg-[#121213] text-[#f8f8f8]", className)}>
      {children}
    </main>
  );
}

export function Surface({ children, className }: BaseProps) {
  return (
    <section className={cn("min-h-screen", className)}>{children}</section>
  );
}

export function Panel({ children, className }: BaseProps) {
  return (
    <section
      className={cn(
        "rounded-lg border border-[#2f3033] bg-[#18191b] p-4",
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
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  BaseProps & { variant?: Variant; size?: Size }) {
  const variants: Record<Variant, string> = {
    primary: "bg-[#f8f8f8] text-[#121213] hover:bg-white",
    secondary: "bg-[#3a3a3c] text-white hover:bg-[#4a4a4d]",
    ghost: "bg-transparent text-[#d7dadc] hover:bg-[#272729]",
    success: "bg-[#538d4e] text-white hover:bg-[#5f9b59]",
    warning: "bg-[#b59f3b] text-white hover:bg-[#c4ad46]",
  };
  const sizes: Record<Size, string> = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-5 text-base",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-bold uppercase tracking-wide transition disabled:cursor-not-allowed disabled:bg-[#272729] disabled:text-[#565758]",
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

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-12 min-w-0 rounded-md border border-[#3a3a3c] bg-[#121213] px-4 font-mono text-lg font-bold uppercase text-white outline-none placeholder:text-[#565758] focus:border-[#d7dadc]",
        className,
      )}
      {...props}
    />
  );
}

export function Badge({ children, className }: BaseProps) {
  return (
    <span
      className={cn(
        "inline-flex h-8 items-center rounded-full bg-[#272729] px-3 text-xs font-bold uppercase text-[#d7dadc]",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SectionKicker({ children, className }: BaseProps) {
  return (
    <p
      className={cn(
        "text-xs font-bold uppercase tracking-[0.18em] text-[#818384]",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative grid size-10 place-items-center overflow-hidden rounded-md border-2 border-[#f97316]/70 bg-[#538d4e] text-sm font-black text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)]",
        className,
      )}
    >
      <span className="relative text-2xl">S</span>
    </div>
  );
}

export function WordTile({
  children,
  state,
  pending,
  active,
}: BaseProps & {
  state?: "correct" | "present" | "absent";
  pending?: boolean;
  active?: boolean;
}) {
  let stateClass = "border-[#3a3a3c] bg-transparent text-white";
  if (pending) {
    stateClass = "border-[#d7dadc] bg-[#272729] text-white";
  } else if (state === "correct") {
    stateClass = "border-[#538d4e] bg-[#538d4e] text-white";
  } else if (state === "present") {
    stateClass = "border-[#b59f3b] bg-[#b59f3b] text-white";
  } else if (state === "absent") {
    stateClass = "border-[#3a3a3c] bg-[#3a3a3c] text-white";
  } else if (active) {
    stateClass = "border-[#565758] bg-transparent text-white";
  }

  return (
    <div
      className={cn(
        "grid aspect-square place-items-center border-2 text-3xl font-black uppercase leading-none sm:text-4xl",
        stateClass,
      )}
    >
      {children}
    </div>
  );
}

export function KeyCap({
  children,
  state,
  onClick,
}: BaseProps & {
  state?: "correct" | "present" | "absent";
  onClick?: () => void;
}) {
  let stateClass = "bg-[#818384] text-white";
  if (state === "correct") {
    stateClass = "bg-[#538d4e] text-white";
  } else if (state === "present") {
    stateClass = "bg-[#b59f3b] text-white";
  } else if (state === "absent") {
    stateClass = "bg-[#3a3a3c] text-white";
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
  const color =
    index === 0
      ? "bg-[#538d4e]"
      : index === 1
        ? "bg-[#b59f3b]"
        : index === 2
          ? "bg-[#3a3a3c]"
          : "bg-[#272729]";
  return (
    <span
      className={cn(
        "grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-black text-white",
        color,
      )}
    >
      {children}
    </span>
  );
}

export function ProgressStrip({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[#272729]">
      <div
        className="h-full rounded-full bg-[#538d4e] transition-[width]"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
