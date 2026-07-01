import { Button, Input, KeyCap, WordTile } from "../components/ui";
import {
  WORD_LENGTH,
  type Attempt,
  type GameState,
  type TileState,
} from "../../shared/game";

const KEY_ROWS = ["AZERTYUIOP", "QSDFGHJKLM", "WXCVBN"];

type SubmitHandler = (event?: SubmitEvent) => void;

export type GameBoardProps = {
  activeRow: number;
  canSubmit: boolean;
  game: GameState;
  inputValue: string;
  localError: string;
  onBackspace: () => void;
  onInput: (value: string) => void;
  onLetter: (letter: string) => void;
  onSubmit: SubmitHandler;
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
  onLetter,
  onBackspace,
  onEnter,
}: {
  states: Record<string, TileState>;
  onLetter: (letter: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
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
  canSubmit,
  game,
  inputValue,
  localError,
  onBackspace,
  onInput,
  onLetter,
  onSubmit,
  pendingGuess,
  rows,
  solvedAttempt,
  states,
}: GameBoardProps) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-5">
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

      <form
        className="grid w-full max-w-sm grid-cols-[1fr_auto] gap-2"
        onSubmit={(event) => void onSubmit(event)}
      >
        <Input
          aria-label="Mot proposé"
          autoComplete="off"
          disabled={game.over || Boolean(pendingGuess)}
          maxLength={WORD_LENGTH}
          name="guess"
          pattern="[A-Za-z]{5}"
          placeholder="OCEAN"
          value={inputValue}
          onInput={(event) =>
            onInput((event.currentTarget as HTMLInputElement).value)
          }
        />
        <Button disabled={!canSubmit} size="lg" type="submit" variant="success">
          Valider
        </Button>
      </form>

      <p className="min-h-6 text-center text-sm font-semibold text-[#d7dadc]">
        {localError || statusText(game, pendingGuess, solvedAttempt)}
      </p>

      <Keyboard
        states={states}
        onBackspace={onBackspace}
        onEnter={() => onSubmit()}
        onLetter={onLetter}
      />
    </div>
  );
}
