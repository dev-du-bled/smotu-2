import { useState } from "react";
import type { LeaderboardSet } from "../../shared/game";
import { LeaderboardList } from "../components/LeaderboardList";
import { Panel, PointsAmount, SectionKicker } from "../components/ui";

type BoardKey = keyof LeaderboardSet;

const BOARDS: Array<{
  key: BoardKey;
  label: string;
  title: string;
  description: string;
  emptyLabel: string;
}> = [
  {
    key: "global",
    label: "Global",
    title: "Top global",
    description: "Le classement par le plus grands nombres de Smotucoins",
    emptyLabel: "Aucun score global pour le moment.",
  },
  {
    key: "daily",
    label: "Mot du jour",
    title: "Mot du jour",
    description: "Le classement par nombre de victoires quotidiennes.",
    emptyLabel: "Aucun score sur le mot du jour pour le moment.",
  },
  {
    key: "endless",
    label: "Mode libre",
    title: "Mode libre",
    description: "Le classement par nombre de manches libres gagnées.",
    emptyLabel: "Aucun score en mode libre pour le moment.",
  },
  {
    key: "mastermind",
    label: "Mastermind",
    title: "Mastermind",
    description: "Le classement par nombre de codes couleur trouvés.",
    emptyLabel: "Aucun score Mastermind pour le moment.",
  },
];

export function LeaderboardPage({
  leaderboards,
  loading = false,
  signedIn,
}: {
  authLoading?: boolean;
  leaderboards: LeaderboardSet;
  loading?: boolean;
  onSignIn: () => void | Promise<void>;
  signedIn: boolean;
}) {
  void signedIn;
  const [activeBoard, setActiveBoard] = useState<BoardKey>("global");
  const board = BOARDS.find((item) => item.key === activeBoard) ?? BOARDS[0];

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_320px]">
      <section>
        <SectionKicker>Classement</SectionKicker>
        <h2 className="mt-2 text-4xl font-black">{board.title}</h2>
        <p className="mt-2 text-subtle-foreground">{board.description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {BOARDS.map((item) => (
            <button
              className={`rounded-md px-3 py-2 text-sm font-bold transition ${
                item.key === activeBoard
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-subtle-foreground hover:bg-muted"
              }`}
              key={item.key}
              type="button"
              onClick={() => setActiveBoard(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="mt-6">
          <LeaderboardList
            board={activeBoard}
            emptyLabel={board.emptyLabel}
            large
            leaderboard={leaderboards[activeBoard]}
            loading={loading}
          />
        </div>
      </section>
      <Panel className="h-fit">
        <SectionKicker>Score</SectionKicker>
        <div className="mt-4 space-y-3 text-sm leading-6 text-subtle-foreground">
          <p className="flex flex-wrap items-center gap-1.5">
            Le mot du jour rapporte jusqu'à
            <PointsAmount className="font-black" iconClassName="size-4" value={900} />
          </p>
          <p className="flex flex-wrap items-center gap-1.5">
            Le mode libre rapporte de
            <PointsAmount className="font-black" iconClassName="size-4" value={280} />
            à
            <PointsAmount className="font-black" iconClassName="size-4" value={560} />
            selon la longueur.
          </p>
          <p className="flex flex-wrap items-center gap-1.5">
            Mastermind rapporte jusqu'à
            <PointsAmount className="font-black" iconClassName="size-4" value={560} />
            par code trouvé.
          </p>
          <p>Le classement global additionne toutes les victoires de l'app.</p>
        </div>
      </Panel>
    </div>
  );
}
