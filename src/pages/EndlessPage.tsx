import {
  getScoreForMode,
  type EndlessGameState,
  type WordLengthOption,
} from "../../shared/game";
import { GameBoard, type GameBoardProps } from "../components/GameBoard";
import {
  Button,
  Panel,
  PointsAmount,
  ProgressStrip,
  SectionKicker,
} from "../components/ui";

export function EndlessPage({
  abandonRound,
  game,
  isAbandoning,
  isStarting,
  playProps,
  selectedWordLength,
  setSelectedWordLength,
  signedIn,
  startRound,
  wordLengthOptions,
}: {
  abandonRound: () => void | Promise<void>;
  game: EndlessGameState;
  isAbandoning: boolean;
  isStarting: boolean;
  playProps: GameBoardProps & { progress: number };
  selectedWordLength: WordLengthOption;
  setSelectedWordLength: (wordLength: WordLengthOption) => void;
  signedIn: boolean;
  startRound: (wordLength?: WordLengthOption) => void | Promise<void>;
  wordLengthOptions: readonly WordLengthOption[];
}) {
  const currentMaxScore = getScoreForMode("endless", 1, game.wordLength);
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
                ? "grid h-10 w-[5.5rem] place-items-center rounded-md bg-success text-sm font-black text-success-foreground"
                : "grid h-10 w-[5.5rem] place-items-center rounded-md bg-secondary text-sm font-black text-secondary-foreground hover:bg-secondary-hover"
            }
            disabled={isStarting}
            key={wordLength}
            type="button"
            onClick={() => setSelectedWordLength(wordLength)}
          >
            <span className="inline-flex items-center justify-center gap-1.5">
              <span className="inline-grid min-w-[1ch] translate-y-[0.055em] place-items-center leading-none">
                {wordLength}
              </span>
              <PointsAmount
                className="leading-none"
                iconClassName="size-4"
                value={getScoreForMode("endless", 1, wordLength)}
              />
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  if (game.status === "idle") {
    return (
      <div className="mx-auto flex min-h-[inherit] max-w-2xl flex-col items-center justify-center px-4 py-10 text-center">
        <Panel className="w-full space-y-5">
          <SectionKicker>Mode libre</SectionKicker>
          <h2 className="text-4xl font-black">Une manche quand tu veux.</h2>
          <p className="text-subtle-foreground">
            Même règle que le mot du jour, mais sans limite quotidienne. Une
            victoire rapporte moins de points, parce que tu peux relancer autant
            de manches que tu veux. En revanche, une manche perdue ou abandonnée
            te coûte des smotucoins : mieux vaut jouer que spammer.
          </p>
          {!signedIn ? (
            <p className="text-sm text-muted-foreground">
              Tu joues en invité : la partie n'est pas enregistrée et ne compte
              pas au classement. Connecte-toi pour garder tes scores.
            </p>
          ) : null}
          {lengthPicker}
          <Button
            disabled={isStarting}
            size="lg"
            type="button"
            variant="success"
            onClick={() => startRound(selectedWordLength)}
          >
            {isStarting ? "Lancement..." : "Nouvelle manche"}
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
            <SectionKicker>Mode libre</SectionKicker>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-subtle-foreground">
              Manche #{game.gamesPlayed} · jusqu'à
              <PointsAmount
                className="font-black"
                iconClassName="size-4"
                value={currentMaxScore}
              />
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!game.over ? (
              <Button
                disabled={isAbandoning || Boolean(playProps.pendingGuess)}
                size="sm"
                type="button"
                variant="warning"
                onClick={abandonRound}
              >
                {isAbandoning ? "Abandon..." : "Abandonner"}
              </Button>
            ) : null}
            {game.over ? (
              <Button
                disabled={isStarting}
                size="sm"
                type="button"
                variant="secondary"
                onClick={() => startRound(selectedWordLength)}
              >
                {isStarting ? "Lancement..." : "Rejouer"}
              </Button>
            ) : null}
          </div>
        </div>
        {game.over ? lengthPicker : null}
        <div>
          <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
            <span>Progression</span>
            <span>
              {game.attempts.length}/{game.maxAttempts}
            </span>
          </div>
          <ProgressStrip value={playProps.progress} />
        </div>
      </div>
      <GameBoard {...playProps} />
    </div>
  );
}
