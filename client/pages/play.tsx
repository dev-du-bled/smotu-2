import { GameBoard, type GameBoardProps } from "../game/board";
import { ProgressStrip } from "../components/ui";

export function PlayPage({
  progress,
  ...boardProps
}: GameBoardProps & { progress: number }) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-65px)] max-w-6xl grid-rows-[auto_1fr] px-4 py-5">
      <div className="mx-auto mb-5 w-full max-w-xl">
        <div className="mb-2 flex items-center justify-between text-sm text-[#818384]">
          <span>Progression</span>
          <span>
            {boardProps.game.attempts.length}/{boardProps.game.maxAttempts}
          </span>
        </div>
        <ProgressStrip value={progress} />
      </div>
      <GameBoard {...boardProps} />
    </div>
  );
}
