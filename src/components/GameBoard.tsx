import { useEffect, useState, type FormEvent } from "react";
import {
  WORD_LENGTH,
  type Attempt,
  type GameState,
  type TileState,
} from "../../shared/game";
import { ConfettiBurst } from "./ConfettiBurst";
import { KeyCap, WordTile } from "./ui";

const KEY_ROWS = ["AZERTYUIOP", "QSDFGHJKLM", "WXCVBN"];

export type GameBoardProps = {
  activeRow: number;
  canSubmit: boolean;
  celebrationKey?: string;
  game: GameState;
  inputValue: string;
  localError: string;
  onBackspace: () => void;
  onInput: (value: string) => void;
  onLetter: (letter: string) => void;
  onSubmit: (event?: FormEvent) => void;
  pendingGuess: string;
  rows: Array<Attempt | undefined>;
  solvedAttempt?: Attempt;
  states: Record<string, TileState>;
};

function wordLetters(value: string): string[] {
  const list = value.split("");
  return Array.from({ length: WORD_LENGTH }, (_, index) => list[index] ?? "");
}

function statusText(
  game: GameState,
  pendingGuess: string,
  solvedAttempt?: Attempt,
): string {
  const remaining = game.maxAttempts - game.attempts.length;

  if (pendingGuess) {
    return "Vérification du mot...";
  }
  if (game.solved) {
    const attempts = solvedAttempt?.attemptNumber ?? 0;
    return `Trouvé en ${attempts} ${attempts > 1 ? "essais" : "essai"}. Score: ${solvedAttempt?.score ?? 0}.`;
  }
  if (game.over) {
    return `Partie terminée. Le mot était ${game.answer}.`;
  }
  return `${remaining} ${remaining > 1 ? "essais restants" : "essai restant"}.`;
}

function Keyboard({
  states,
  onBackspace,
  onEnter,
  onLetter,
}: {
  states: Record<string, TileState>;
  onBackspace: () => void;
  onEnter: () => void;
  onLetter: (letter: string) => void;
}) {
  return (
    <div className="mx-auto grid w-full max-w-xl gap-2">
      {KEY_ROWS.map((row, rowIndex) => (
        <div className="flex justify-center gap-1.5" key={row}>
          {rowIndex === 2 ? (
            <button
              className="h-12 rounded bg-[#818384] px-3 text-xs font-black uppercase text-white"
              type="button"
              onClick={onEnter}
            >
              Valider
            </button>
          ) : null}
          {row.split("").map((letter) => (
            <KeyCap
              key={letter}
              state={states[letter]}
              onClick={() => onLetter(letter)}
            >
              {letter}
            </KeyCap>
          ))}
          {rowIndex === 2 ? (
            <button
              className="h-12 rounded bg-[#818384] px-3 text-xs font-black uppercase text-white"
              type="button"
              onClick={onBackspace}
            >
              Retour
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function GameBoard({
  activeRow,
  celebrationKey,
  game,
  inputValue,
  localError,
  onBackspace,
  onLetter,
  onSubmit,
  pendingGuess,
  rows,
  solvedAttempt,
  states,
}: GameBoardProps) {
  const [debugCelebrationKey, setDebugCelebrationKey] = useState("");

  // Capture le clavier physique: on saisit directement dans la grille, sans zone de texte.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key === "Enter") {
        onSubmit();
        return;
      }
      if (game.over || pendingGuess) {
        return;
      }
      if (event.key === "Backspace") {
        event.preventDefault();
        onBackspace();
        return;
      }
      if (/^[a-zA-Z]$/.test(event.key)) {
        onLetter(event.key.toUpperCase());
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [game.over, pendingGuess, onBackspace, onLetter, onSubmit]);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-5">
      <ConfettiBurst burstKey={celebrationKey} />
      {import.meta.env.DEV ? <ConfettiBurst burstKey={debugCelebrationKey} /> : null}

      <div className="w-full max-w-sm">
        <div className="grid gap-1.5">
          {rows.map((attempt, rowIndex) => {
            const pending = attempt?.id === "pending";
            const rowLetters = attempt
              ? wordLetters(attempt.guess)
              : rowIndex === activeRow
                ? wordLetters(inputValue)
                : Array.from({ length: WORD_LENGTH }, () => "");

            return (
              <div
                className="grid grid-cols-5 gap-1.5"
                key={attempt?.id ?? `empty-${rowIndex}`}
              >
                {rowLetters.map((letter, index) => (
                  <WordTile
                    active={rowIndex === activeRow}
                    key={`${rowIndex}-${index}`}
                    pending={pending}
                    state={attempt?.pattern[index]}
                  >
                    {letter}
                  </WordTile>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <p className="min-h-6 text-center text-sm font-semibold text-[#d7dadc]">
        {localError || statusText(game, pendingGuess, solvedAttempt)}
      </p>

      {import.meta.env.DEV ? (
        <button
          className="rounded-md border border-dashed border-[#f97316]/60 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#f97316] transition hover:border-[#f97316] hover:bg-[#f97316]/10"
          type="button"
          onClick={() => setDebugCelebrationKey(`debug-${Date.now()}`)}
        >
          Debug confettis
        </button>
      ) : null}

      <Keyboard
        states={states}
        onBackspace={onBackspace}
        onEnter={() => onSubmit()}
        onLetter={onLetter}
      />
    </div>
  );
}
