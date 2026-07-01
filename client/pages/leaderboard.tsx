import type { LeaderboardEntry } from "../../shared/game";
import { LeaderboardList } from "../components/leaderboard-list";
import { Panel, SectionKicker } from "../components/ui";

export function LeaderboardPage({
  leaderboard,
}: {
  leaderboard: LeaderboardEntry[];
}) {
  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_320px]">
      <section>
        <SectionKicker>Classement</SectionKicker>
        <h2 className="mt-2 text-4xl font-black">Top du jour</h2>
        <div className="mt-6">
          <LeaderboardList large leaderboard={leaderboard} />
        </div>
      </section>
      <Panel className="h-fit">
        <SectionKicker>Score</SectionKicker>
        <div className="mt-4 space-y-3 text-sm leading-6 text-[#d7dadc]">
          <p>Le score diminue à chaque essai utilisé.</p>
          <p>Plus tu trouves vite, plus tu montes dans le classement.</p>
          <p>Le classement est remis à zéro chaque jour.</p>
        </div>
      </Panel>
    </div>
  );
}
