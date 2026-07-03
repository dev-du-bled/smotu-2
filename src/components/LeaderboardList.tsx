import type { GlobalLeaderboardEntry, LeaderboardSet } from "../../shared/game";
import { PointsAmount } from "./ui";

type BoardKey = keyof LeaderboardSet;

function winsForBoard(entry: GlobalLeaderboardEntry, board: BoardKey): number {
  if (board === "daily") {
    return entry.dailySolved;
  }
  if (board === "endless") {
    return entry.endlessSolved;
  }
  if (board === "mastermind") {
    return entry.mastermindSolved;
  }
  return entry.gamesSolved;
}

function scoreForBoard(entry: GlobalLeaderboardEntry, board: BoardKey): number {
  if (board === "daily") {
    return entry.dailyScore;
  }
  if (board === "endless") {
    return entry.endlessScore;
  }
  if (board === "mastermind") {
    return entry.mastermindScore;
  }
  return entry.totalScore;
}

function LeaderboardAvatar({
  entry,
  index,
}: {
  entry: GlobalLeaderboardEntry;
  index: number;
}) {
  const initial = entry.userName.slice(0, 1).toUpperCase() || "?";

  return (
    <div className="relative size-12 shrink-0">
      <div className="grid size-12 place-items-center overflow-hidden rounded-md border border-border bg-success text-lg font-black text-success-foreground">
        <span>{initial}</span>
        {entry.userImage ? (
          <img
            alt=""
            className="absolute inset-0 size-full object-cover rounded-sm"
            referrerPolicy="no-referrer"
            src={entry.userImage}
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : null}
      </div>
      <span className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full border-2 border-card bg-primary text-xs font-black text-primary-foreground">
        {index + 1}
      </span>
    </div>
  );
}

function ScoreDivider() {
  return <span className="size-1.5 rounded-full bg-secondary" aria-hidden="true" />;
}

export function LeaderboardList({
  board = "global",
  emptyLabel = "Aucun score pour le moment.",
  leaderboard,
  large = false,
}: {
  board?: BoardKey;
  emptyLabel?: string;
  leaderboard: GlobalLeaderboardEntry[];
  large?: boolean;
}) {
  return (
    <ol className="space-y-2">
      {leaderboard.length ? (
        leaderboard.map((entry, index) => (
          <li
            className={`flex items-center gap-3 rounded-md border border-border bg-card ${
              large ? "p-4" : "p-3"
            }`}
            key={entry.userId}
          >
            <LeaderboardAvatar entry={entry} index={index} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{entry.userName}</p>
              <p className="text-sm text-muted-foreground">
                {winsForBoard(entry, board)}{" "}
                {winsForBoard(entry, board) > 1 ? "victoires" : "victoire"}
              </p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-muted-strong">
                {board === "global" ? (
                  <>
                    <span className="inline-flex items-center gap-2">
                      Jour <PointsAmount iconClassName="size-3.5" value={entry.dailyScore} />
                    </span>
                    <ScoreDivider />
                    <span className="inline-flex items-center gap-1">
                      Libre <PointsAmount iconClassName="size-3.5" value={entry.endlessScore} />
                    </span>
                    <ScoreDivider />
                    <span className="inline-flex items-center gap-1">
                      Mastermind <PointsAmount iconClassName="size-3.5" value={entry.mastermindScore} />
                    </span>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    Score <PointsAmount iconClassName="size-3.5" value={scoreForBoard(entry, board)} />
                  </span>
                )}
              </div>
            </div>
            {board === "global" ? (
              <PointsAmount
                className="text-lg font-black"
                iconClassName="size-5"
                value={entry.totalScore}
              />
            ) : (
              <p className="text-right leading-tight">
                <span className="block text-lg font-black">
                  {winsForBoard(entry, board)}
                </span>
                <span className="block text-xs font-semibold text-muted-foreground">
                  {winsForBoard(entry, board) > 1 ? "victoires" : "victoire"}
                </span>
              </p>
            )}
          </li>
        ))
      ) : (
        <li className="rounded-md border border-dashed border-input p-5 text-sm text-muted-foreground">
          {emptyLabel}
        </li>
      )}
    </ol>
  );
}
