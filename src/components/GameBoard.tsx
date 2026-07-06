import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  type Attempt,
  type GameState,
  type ShopItemId,
  type TileState,
} from "../../shared/game";
import { ConfettiBurst } from "./ConfettiBurst";
import { KeyCap, WordTile } from "./ui";

const KEY_ROWS = ["AZERTYUIOP", "QSDFGHJKLM", "WXCVBN"];

export type GameBoardProps = {
  activeRow: number;
  canSubmit: boolean;
  celebrationKey?: string;
  confettiSkin?: ShopItemId;
  debugAnswer?: string;
  game: GameState;
  inputValue: string;
  localError: string;
  lossPenalty?: number;
  onBackspace: () => void;
  onInput: (value: string) => void;
  onLetter: (letter: string) => void;
  onSubmit: (event?: FormEvent) => void;
  pendingGuess: string;
  rows: Array<Attempt | undefined>;
  solvedAttempt?: Attempt;
  states: Record<string, TileState>;
};

function wordLetters(value: string, wordLength: number): string[] {
  const list = value.split("");
  return Array.from({ length: wordLength }, (_, index) => list[index] ?? "");
}

function statusText(
  game: GameState,
  pendingGuess: string,
  solvedAttempt?: Attempt,
  lossPenalty?: number,
): ReactNode {
  const remaining = game.maxAttempts - game.attempts.length;

  if (pendingGuess) {
    return "Vérification du mot...";
  }
  if (game.solved) {
    const attempts = solvedAttempt?.attemptNumber ?? 0;
    return (
      <span className="inline-flex flex-wrap items-center justify-center gap-1.5">
        Trouvé en {attempts} {attempts > 1 ? "essais" : "essai"}. Score:
        <span className="font-mono font-black tabular-nums">
          {(solvedAttempt?.score ?? 0).toLocaleString("fr-FR")}
        </span>
      </span>
    );
  }
  if (game.over) {
    if (lossPenalty && lossPenalty > 0) {
      return (
        <span className="inline-flex flex-wrap items-center justify-center gap-1.5">
          Partie terminée. Le mot était {game.answer}. Malus:
          <span className="font-mono font-black tabular-nums text-destructive">
            {(-lossPenalty).toLocaleString("fr-FR")}
          </span>
        </span>
      );
    }
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
              className="h-12 rounded bg-success px-3 text-xs font-black uppercase text-success-foreground hover:bg-success-hover"
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
              className="h-12 rounded bg-orange px-3 text-xs font-black uppercase text-orange-foreground hover:bg-orange-hover"
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
  confettiSkin,
  debugAnswer,
  game,
  inputValue,
  localError,
  lossPenalty,
  onBackspace,
  onLetter,
  onSubmit,
  pendingGuess,
  rows,
  solvedAttempt,
  states,
}: GameBoardProps) {
  const [debugCelebrationKey, setDebugCelebrationKey] = useState("");
  const wordLength = game.wordLength;

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
      <ConfettiBurst burstKey={celebrationKey} skin={confettiSkin} />
      {import.meta.env.DEV ? (
        <ConfettiBurst burstKey={debugCelebrationKey} skin={confettiSkin} />
      ) : null}

      <div className="w-full max-w-sm">
        <div className="grid gap-1.5">
          {rows.map((attempt, rowIndex) => {
            const pending = attempt?.id === "pending";
            const rowLetters = attempt
              ? wordLetters(attempt.guess, wordLength)
              : rowIndex === activeRow
                ? wordLetters(inputValue, wordLength)
                : Array.from({ length: wordLength }, () => "");

            return (
              <div
                className="grid gap-1.5"
                key={attempt?.id ?? `empty-${rowIndex}`}
                style={{ gridTemplateColumns: `repeat(${wordLength}, minmax(0, 1fr))` }}
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

      <p className="min-h-6 text-center text-sm font-semibold text-subtle-foreground">
        {localError || statusText(game, pendingGuess, solvedAttempt, lossPenalty)}
      </p>

      {import.meta.env.DEV ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            className="rounded-md border border-dashed border-orange/60 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-orange transition hover:border-orange hover:bg-orange/10"
            type="button"
            onClick={() => setDebugCelebrationKey(`debug-${Date.now()}`)}
          >
            Debug confettis
          </button>
          {debugAnswer ? (
            <span className="rounded-md border border-dashed border-orange/60 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wide text-orange">
              Mot: {debugAnswer}
            </span>
          ) : null}
        </div>
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
