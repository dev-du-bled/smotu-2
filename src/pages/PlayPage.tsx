import { GameBoard, type GameBoardProps } from "../components/GameBoard";
import { PointsAmount, ProgressStrip, SectionKicker } from "../components/ui";

export function PlayPage({
  onSignIn,
  playProps,
  signedIn,
}: {
  authLoading?: boolean;
  onSignIn: () => void | Promise<void>;
  playProps?: GameBoardProps & { progress: number };
  signedIn: boolean;
}) {
  if (!playProps) {
    return null;
  }

  return (
    <div className="mx-auto grid min-h-[inherit] max-w-6xl grid-rows-[auto_1fr] px-4 py-5">
      <div className="mx-auto mb-5 grid w-full max-w-xl gap-3">
        <div>
          <SectionKicker>Mot du jour</SectionKicker>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-subtle-foreground">
            Une seule grille quotidienne · jusqu'à
            <PointsAmount className="font-black" iconClassName="size-4" value={900} />
          </p>
          {!signedIn ? (
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              Invité: ta partie ne compte pas au classement.
            </p>
          ) : null}
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
            <span>Progression</span>
            <span>
              {playProps.game.attempts.length}/{playProps.game.maxAttempts}
            </span>
          </div>
          <ProgressStrip value={playProps.progress} />
        </div>
      </div>
      <GameBoard {...playProps} />
    </div>
  );
}
