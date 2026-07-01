import { Link } from "lakebed/client";
import type { GameState } from "../../shared/game";
import { Panel, SectionKicker } from "../components/ui";

export function HomePage({
  bestScore,
  game,
  leaderboardCount,
}: {
  bestScore: number;
  game: GameState;
  leaderboardCount: number;
}) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-65px)] max-w-6xl items-center gap-8 px-4 py-10 lg:grid-cols-[1fr_380px]">
      <section>
        <SectionKicker>Smotu</SectionKicker>
        <h2 className="mt-4 max-w-3xl text-5xl font-black leading-[0.95] sm:text-7xl">
          Devine le mot du jour.
        </h2>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-[#d7dadc]">
          Un mot de cinq lettres, six essais, un classement quotidien. Tes
          propositions sont libres: tant que le mot fait cinq lettres, il passe.
          Les cases vertes sont bien placées, les jaunes sont dans le mot, les
          grises sont absentes.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="inline-flex h-12 items-center justify-center rounded-md bg-[#538d4e] px-5 text-base font-bold uppercase tracking-wide text-white transition hover:bg-[#5f9b59]"
            to="/play"
          >
            Jouer au mot du jour
          </Link>
          <Link
            className="inline-flex h-12 items-center justify-center rounded-md bg-[#3a3a3c] px-5 text-base font-bold uppercase tracking-wide text-white transition hover:bg-[#4a4a4d]"
            to="/leaderboard"
          >
            Voir le classement
          </Link>
        </div>
      </section>

      <Panel className="space-y-4">
        <div>
          <SectionKicker>Aujourd'hui</SectionKicker>
          <p className="mt-2 font-mono text-3xl font-black">
            {game.dateKey || "..."}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md bg-[#272729] p-4">
            <p className="text-3xl font-black">{bestScore}</p>
            <p className="text-sm text-[#818384]">Meilleur score</p>
          </div>
          <div className="rounded-md bg-[#272729] p-4">
            <p className="text-3xl font-black">{leaderboardCount}</p>
            <p className="text-sm text-[#818384]">Joueurs classés</p>
          </div>
        </div>
        <div className="rounded-md bg-[#272729] p-4">
          <p className="text-sm text-[#d7dadc]">
            Tu as utilisé {game.attempts.length}{" "}
            {game.attempts.length > 1 ? "essais" : "essai"} sur{" "}
            {game.maxAttempts}.
          </p>
        </div>
      </Panel>
    </div>
  );
}
