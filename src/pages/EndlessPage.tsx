import type { EndlessGameState } from "../../shared/game";
import { AuthRequired } from "../components/AuthRequired";
import { GameBoard, type GameBoardProps } from "../components/GameBoard";
import { Button, Panel, ProgressStrip, SectionKicker } from "../components/ui";

export function EndlessPage({
  authLoading = false,
  game,
  isStarting,
  onSignIn,
  playProps,
  signedIn,
  startRound,
}: {
  authLoading?: boolean;
  game?: EndlessGameState;
  isStarting: boolean;
  onSignIn: () => void | Promise<void>;
  playProps?: GameBoardProps & { progress: number };
  signedIn: boolean;
  startRound: () => void | Promise<void>;
}) {
  if (!signedIn || !game || !playProps) {
    return (
      <AuthRequired
        loading={authLoading}
        title={
          authLoading
            ? "Vérification de ta session."
            : "Connecte-toi pour lancer le mode libre."
        }
        description="Le mode libre enregistre tes manches, tes victoires et tes points sur ton compte."
        eyebrow="Mode libre"
        onSignIn={onSignIn}
      />
    );
  }

  if (game.status === "idle") {
    return (
      <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center px-4 py-10 text-center">
        <Panel className="w-full space-y-5">
          <SectionKicker>Mode libre</SectionKicker>
          <h2 className="text-4xl font-black">Une manche quand tu veux.</h2>
          <p className="text-[#d7dadc]">
            Même règle que le mot du jour, mais sans limite quotidienne. Une
            victoire rapporte moins de points, parce que tu peux relancer autant
            de manches que tu veux.
          </p>
          <Button
            disabled={isStarting}
            size="lg"
            type="button"
            variant="success"
            onClick={startRound}
          >
            {isStarting ? "Lancement..." : "Nouvelle manche"}
          </Button>
        </Panel>
      </div>
    );
  }

  return (
    <div className="mx-auto grid min-h-full max-w-6xl grid-rows-[auto_1fr] px-4 py-5">
      <div className="mx-auto mb-5 grid w-full max-w-xl gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <SectionKicker>Mode libre</SectionKicker>
            <p className="mt-1 text-sm font-semibold text-[#d7dadc]">
              Manche #{game.gamesPlayed} · jusqu'à 360 points
            </p>
          </div>
          {game.over ? (
            <Button
              disabled={isStarting}
              size="sm"
              type="button"
              variant="secondary"
              onClick={startRound}
            >
              {isStarting ? "Lancement..." : "Rejouer"}
            </Button>
          ) : null}
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between text-sm text-[#818384]">
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
