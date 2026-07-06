import {
  MASTERMIND_COLORS,
  type Attempt,
  type MastermindAttempt,
  type MastermindColorId,
} from "../../shared/game";
import { cn } from "../lib/utils";
import { WordTile } from "./ui";

// Composants de plateau réutilisables entre le playground et le panel admin :
// même rendu que la partie jouée, mais en lecture seule (pas de clavier ni de
// saisie).

export const COLOR_BY_ID = Object.fromEntries(
  MASTERMIND_COLORS.map((color) => [color.id, color]),
) as Record<MastermindColorId, (typeof MASTERMIND_COLORS)[number]>;

function wordLetters(value: string, wordLength: number): string[] {
  const list = value.split("");
  return Array.from({ length: wordLength }, (_, index) => list[index] ?? "");
}

export function WordBoard({
  attempts,
  className,
  maxAttempts,
  size = "sm",
  wordLength,
}: {
  attempts: Attempt[];
  className?: string;
  maxAttempts: number;
  size?: "sm" | "md";
  wordLength: number;
}) {
  const rows = Array.from(
    { length: Math.max(maxAttempts, attempts.length) },
    (_, index) => attempts[index],
  );

  return (
    <div className={cn("grid gap-1", className)}>
      {rows.map((attempt, rowIndex) => {
        const letters = attempt
          ? wordLetters(attempt.guess, wordLength)
          : Array.from({ length: wordLength }, () => "");

        return (
          <div
            className="grid gap-1"
            key={attempt?.id ?? `empty-${rowIndex}`}
            style={{
              gridTemplateColumns: `repeat(${wordLength}, minmax(0, 1fr))`,
            }}
          >
            {letters.map((letter, index) => (
              <WordTile key={index} size={size} state={attempt?.pattern[index]}>
                {letter}
              </WordTile>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export function ColorPeg({
  color,
  empty = false,
  label,
  size = "md",
}: {
  color?: MastermindColorId;
  empty?: boolean;
  label?: string;
  size?: "sm" | "md" | "lg";
}) {
  const colorMeta = color ? COLOR_BY_ID[color] : undefined;
  const sizes = {
    sm: "size-5",
    md: "size-9",
    lg: "size-11",
  };

  return (
    <span
      aria-label={label ?? colorMeta?.name ?? "Emplacement vide"}
      className={`${sizes[size]} inline-flex shrink-0 rounded-full border-2 ${
        empty
          ? "border-dashed border-muted-strong bg-transparent"
          : "border-foreground/20 shadow-[inset_0_-3px_0_rgba(0,0,0,0.24)]"
      }`}
      role="img"
      style={colorMeta && !empty ? { backgroundColor: colorMeta.hex } : undefined}
    />
  );
}

export function FeedbackPegs({
  exact,
  present,
}: {
  exact: number;
  present: number;
}) {
  const pegs = [
    ...Array.from({ length: exact }, (_, index) => ({
      key: `exact-${index}`,
      className: "bg-primary",
      label: "Bien place",
    })),
    ...Array.from({ length: present }, (_, index) => ({
      key: `present-${index}`,
      className: "bg-warning",
      label: "Bonne couleur",
    })),
  ];

  return (
    <div
      className="grid grid-cols-2 gap-1"
      aria-label={`${exact} bien placées, ${present} bonnes couleurs`}
    >
      {Array.from({ length: 4 }, (_, index) => {
        const peg = pegs[index];

        return (
          <span
            aria-label={peg?.label ?? "Indice vide"}
            className={`size-3 rounded-full ${peg?.className ?? "bg-secondary"}`}
            key={peg?.key ?? `empty-${index}`}
          />
        );
      })}
    </div>
  );
}

export function MastermindAttemptRow({ attempt }: { attempt: MastermindAttempt }) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border border-border bg-card p-3">
      <p className="w-8 font-mono text-sm font-black text-muted-foreground">
        {attempt.attemptNumber}
      </p>
      <div className="flex gap-2">
        {attempt.guess.map((color, index) => (
          <ColorPeg
            color={color}
            key={`${attempt.id}-${index}`}
            label={COLOR_BY_ID[color].name}
          />
        ))}
      </div>
      <FeedbackPegs exact={attempt.exact} present={attempt.present} />
    </div>
  );
}

export function MastermindBoard({
  attempts,
}: {
  attempts: MastermindAttempt[];
}) {
  if (attempts.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-input p-5 text-center text-sm text-muted-foreground">
        Aucune proposition.
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {attempts.map((attempt) => (
        <MastermindAttemptRow attempt={attempt} key={attempt.id} />
      ))}
    </div>
  );
}
