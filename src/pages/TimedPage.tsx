import type { ShopItemId, WordLengthOption } from "../../shared/game";
import { GameBoard, type GameBoardProps } from "../components/GameBoard";
import { Button, Panel, ProgressStrip, SectionKicker } from "../components/ui";
import { TIMED_GAME_SECONDS } from "../game/use-timed-game";

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function TimedPage({
  confettiSkin,
  playProps,
  progress,
  selectedWordLength,
  setSelectedWordLength,
  skipWord,
  startGame,
  status,
  timeLeft,
  wordsSkipped,
  wordsSolved,
  wordLengthOptions,
}: {
  confettiSkin?: ShopItemId;
  playProps: GameBoardProps & { progress: number };
  progress: number;
  selectedWordLength: WordLengthOption;
  setSelectedWordLength: (wordLength: WordLengthOption) => void;
  skipWord: () => void;
  startGame: (wordLength?: WordLengthOption) => void;
  status: "idle" | "active" | "finished";
  timeLeft: number;
  wordsSkipped: number;
  wordsSolved: number;
  wordLengthOptions: readonly WordLengthOption[];
}) {
  const lengthPicker = (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
        Lettres
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {wordLengthOptions.map((wordLength) => (
          <button
            className={
              wordLength === selectedWordLength
                ? "grid h-10 w-14 place-items-center rounded-md bg-orange text-sm font-black text-orange-foreground"
                : "grid h-10 w-14 place-items-center rounded-md bg-secondary text-sm font-black text-secondary-foreground hover:bg-secondary-hover"
            }
            disabled={status === "active"}
            key={wordLength}
            type="button"
            onClick={() => setSelectedWordLength(wordLength)}
          >
            {wordLength}
          </button>
        ))}
      </div>
    </div>
  );

  if (status === "idle") {
    return (
      <div className="mx-auto flex min-h-[inherit] max-w-2xl flex-col items-center justify-center px-4 py-10 text-center">
        <Panel className="w-full space-y-5">
          <SectionKicker>Mode chrono</SectionKicker>
          <h2 className="text-4xl font-black">Un maximum de mots en 120s.</h2>
          <p className="text-subtle-foreground">
            Lance le compte à rebours, devine un mot, puis passe directement au
            suivant. Chaque mot trouvé ajoute 1 au compteur. Si tu utilises tes
            6 essais, le mot est passé automatiquement pour garder le rythme.
          </p>
          {lengthPicker}
          <Button size="lg" type="button" variant="warning" onClick={() => startGame(selectedWordLength)}>
            Démarrer le chrono
          </Button>
        </Panel>
      </div>
    );
  }

  return (
    <div className="mx-auto grid min-h-[inherit] max-w-6xl grid-rows-[auto_1fr] px-4 py-5">
      <div className="mx-auto mb-5 grid w-full max-w-xl gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <SectionKicker>Mode chrono</SectionKicker>
            <p className="mt-1 inline-flex flex-wrap items-center gap-1.5 text-sm font-semibold text-subtle-foreground">
              <span className="font-mono text-lg font-black tabular-nums text-orange">
                {formatTime(timeLeft)}
              </span>
              · {wordsSolved} {wordsSolved > 1 ? "mots trouvés" : "mot trouvé"}
              {wordsSkipped ? ` · ${wordsSkipped} passés` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {status === "active" ? (
              <Button size="sm" type="button" variant="secondary" onClick={skipWord}>
                Passer
              </Button>
            ) : null}
            {status === "finished" ? (
              <Button size="sm" type="button" variant="warning" onClick={() => startGame(selectedWordLength)}>
                Rejouer 120s
              </Button>
            ) : null}
          </div>
        </div>
        {status === "finished" ? lengthPicker : null}
        <div>
          <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
            <span>Temps écoulé</span>
            <span>{TIMED_GAME_SECONDS - timeLeft}/{TIMED_GAME_SECONDS}s</span>
          </div>
          <ProgressStrip value={progress} />
        </div>
      </div>
      <GameBoard {...playProps} confettiSkin={confettiSkin} />
    </div>
  );
}
