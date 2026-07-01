import type { LeaderboardEntry } from "../../shared/game";
import { RankMedal } from "./ui";

export function LeaderboardList({
  leaderboard,
  large = false,
}: {
  leaderboard: LeaderboardEntry[];
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
                {entry.attempts} {entry.attempts > 1 ? "essais" : "essai"}
              </p>
            </div>
            <p className="font-mono text-lg font-black">{entry.score}</p>
          </li>
        ))
      ) : (
        <li className="rounded-md border border-dashed border-[#3a3a3c] p-5 text-sm text-[#818384]">
          Aucun joueur classé aujourd'hui.
        </li>
      )}
    </ol>
  );
}
