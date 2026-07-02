import { Link } from "react-router-dom";
import type { GameState } from "../../shared/game";
import { Panel, SectionKicker } from "../components/ui";

function formatDateKey(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);

  if (!year || !month || !day) {
    return "...";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(year, month - 1, day));
}

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
    <div className="mx-auto grid min-h-full max-w-6xl items-center gap-8 px-4 py-10 lg:grid-cols-[1fr_380px]">
      <section>
        <SectionKicker>Smotu</SectionKicker>
        <h2 className="mt-4 max-w-3xl text-5xl font-black leading-[0.95] sm:text-7xl">
          Devine le mot. Marque des points.
        </h2>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-[#d7dadc]">
          Deux modes, une même règle: cinq lettres, six essais, des propositions
          libres. Le mot du jour rapporte beaucoup de points, le mode libre en
          rapporte moins mais se joue autant de fois que tu veux.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="inline-flex h-12 items-center justify-center rounded-md bg-[#538d4e] px-5 text-base font-bold uppercase tracking-wide text-white transition hover:bg-[#5f9b59]"
            to="/play"
          >
            Jouer au mot du jour
          </Link>
          <Link
            className="inline-flex h-12 items-center justify-center rounded-md bg-[#b59f3b] px-5 text-base font-bold uppercase tracking-wide text-white transition hover:bg-[#c4ad46]"
            to="/endless"
          >
            Mode libre
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
          <p className="mt-2 text-3xl font-black capitalize leading-tight">
            {formatDateKey(game.dateKey)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md bg-[#272729] p-4">
            <p className="text-3xl font-black">{bestScore}</p>
            <p className="text-sm text-[#818384]">Top score global</p>
          </div>
          <div className="rounded-md bg-[#272729] p-4">
            <p className="text-3xl font-black">{leaderboardCount}</p>
            <p className="text-sm text-[#818384]">Joueurs au classement</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-[#538d4e]/50 bg-[#182019] p-4">
            <p className="font-black">Mot du jour</p>
            <p className="text-sm text-[#818384]">Jusqu'à 900 points</p>
          </div>
          <div className="rounded-md border border-[#b59f3b]/50 bg-[#211f16] p-4">
            <p className="font-black">Mode libre</p>
            <p className="text-sm text-[#818384]">Jusqu'à 360 points</p>
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
