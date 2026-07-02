import type { GlobalLeaderboardEntry } from "../../shared/game";
import { RankMedal } from "./ui";

export function LeaderboardList({
  emptyLabel = "Aucun score pour le moment.",
  leaderboard,
  large = false,
}: {
  emptyLabel?: string;
  leaderboard: GlobalLeaderboardEntry[];
  large?: boolean;
}) {
  return (
    <ol className="space-y-2">
      {leaderboard.length ? (
        leaderboard.map((entry, index) => (
          <li
            className={`flex items-center gap-3 rounded-md border border-[#2f3033] bg-[#18191b] ${
              large ? "p-4" : "p-3"
            }`}
            key={entry.userId}
          >
            <RankMedal index={index}>{index + 1}</RankMedal>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{entry.userName}</p>
              <p className="text-sm text-[#818384]">
                {entry.gamesSolved}{" "}
                {entry.gamesSolved > 1 ? "victoires" : "victoire"}
              </p>
              <p className="text-xs font-semibold text-[#565758]">
                Jour {entry.dailyScore} · Libre {entry.endlessScore} · Mastermind{" "}
                {entry.mastermindScore}
              </p>
            </div>
            <p className="font-mono text-lg font-black">{entry.totalScore}</p>
          </li>
        ))
      ) : (
        <li className="rounded-md border border-dashed border-[#3a3a3c] p-5 text-sm text-[#818384]">
          {emptyLabel}
        </li>
      )}
    </ol>
  );
}
