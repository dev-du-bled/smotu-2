import { Link } from "react-router-dom";
import type { GlobalLeaderboardEntry, LeaderboardSet } from "../../shared/game";
import { AvatarDisplay } from "./AvatarDisplay";
import { PointsAmount, Skeleton } from "./ui";

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

const PODIUM_ROW = [
  "border-[#f6b100]/60 bg-[#f6b100]/10",
  "border-[#c9ced6]/60 bg-[#c9ced6]/15",
  "border-[#cd7f32]/55 bg-[#cd7f32]/10",
] as const;

function rowClass(index: number): string {
  return PODIUM_ROW[index] ?? "border-border bg-card";
}

function LeaderboardAvatar({
  entry,
  index,
}: {
  entry: GlobalLeaderboardEntry;
  index: number;
}) {
  return (
    <AvatarDisplay
      avatar={entry.publicAvatar}
      label={`Avatar de ${entry.userName}`}
      rank={index + 1}
      size="sm"
    />
  );
}

function ScoreDivider() {
  return <span className="size-1.5 rounded-full bg-secondary" aria-hidden="true" />;
}

function LeaderboardRowSkeleton({ large }: { large: boolean }) {
  return (
    <li
      className={`flex items-center gap-3 rounded-md border border-border bg-card ${
        large ? "p-4" : "p-3"
      }`}
    >
      <div className="relative size-12 shrink-0">
        <Skeleton className="size-12 rounded-md" />
        <Skeleton className="absolute -bottom-1 -right-1 size-6 rounded-full border-2 border-card" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-52 max-w-full" />
      </div>
      <Skeleton className={large ? "h-7 w-16" : "h-6 w-12"} />
    </li>
  );
}

export function LeaderboardList({
  board = "global",
  emptyLabel = "Aucun score pour le moment.",
  leaderboard,
  large = false,
  loading = false,
}: {
  board?: BoardKey;
  emptyLabel?: string;
  leaderboard: GlobalLeaderboardEntry[];
  large?: boolean;
  loading?: boolean;
}) {
  if (loading && leaderboard.length === 0) {
    return (
      <ol className="space-y-2">
        {Array.from({ length: large ? 6 : 3 }, (_, index) => (
          <LeaderboardRowSkeleton key={index} large={large} />
        ))}
      </ol>
    );
  }

  return (
    <ol className="space-y-2">
      {leaderboard.length ? (
        leaderboard.map((entry, index) => (
          <li
            className={`flex items-center gap-3 rounded-md border ${rowClass(
              index,
            )} ${large ? "p-4" : "p-3"}`}
            key={entry.userId}
          >
            <Link
              className="shrink-0 transition-[scale] active:scale-[0.96]"
              to={`/players/${encodeURIComponent(entry.userId)}`}
            >
              <LeaderboardAvatar entry={entry} index={index} />
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                className="block truncate font-bold transition-colors hover:text-primary"
                to={`/players/${encodeURIComponent(entry.userId)}`}
              >
                {entry.userName}
              </Link>
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
