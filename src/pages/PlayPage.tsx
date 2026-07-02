import { AuthRequired } from "../components/AuthRequired";
import { GameBoard, type GameBoardProps } from "../components/GameBoard";
import { ProgressStrip, SectionKicker } from "../components/ui";

export function PlayPage({
  authLoading = false,
  onSignIn,
  playProps,
  signedIn,
}: {
  authLoading?: boolean;
  onSignIn: () => void | Promise<void>;
  playProps?: GameBoardProps & { progress: number };
  signedIn: boolean;
}) {
  if (!signedIn || !playProps) {
    return (
      <AuthRequired
        loading={authLoading}
        title={
          authLoading
            ? "Vérification de ta session."
            : "Connecte-toi pour jouer au mot du jour."
        }
        description="Le mot du jour garde une seule grille par compte et attribue les gros points au bon profil."
        eyebrow="Mot du jour"
        onSignIn={onSignIn}
      />
    );
  }

  return (
    <div className="mx-auto grid min-h-[inherit] max-w-6xl grid-rows-[auto_1fr] px-4 py-5">
      <div className="mx-auto mb-5 grid w-full max-w-xl gap-3">
        <div>
          <SectionKicker>Mot du jour</SectionKicker>
          <p className="mt-1 text-sm font-semibold text-[#d7dadc]">
            Une seule grille quotidienne · jusqu'à 900 points
          </p>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between text-sm text-[#818384]">
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
