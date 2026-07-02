import { useState } from "react";
import type { LeaderboardSet } from "../../shared/game";
import { AuthRequired } from "../components/AuthRequired";
import { LeaderboardList } from "../components/LeaderboardList";
import { Panel, SectionKicker } from "../components/ui";

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
    description: "Tous les points de l'app additionnés.",
    emptyLabel: "Aucun score global pour le moment.",
  },
  {
    key: "daily",
    label: "Mot du jour",
    title: "Mot du jour",
    description: "Le classement des victoires quotidiennes.",
    emptyLabel: "Aucun score sur le mot du jour pour le moment.",
  },
  {
    key: "endless",
    label: "Mode libre",
    title: "Mode libre",
    description: "Les points gagnés sur les manches libres.",
    emptyLabel: "Aucun score en mode libre pour le moment.",
  },
  {
    key: "mastermind",
    label: "Mastermind",
    title: "Mastermind",
    description: "Les joueurs qui cassent le mieux les codes couleur.",
    emptyLabel: "Aucun score Mastermind pour le moment.",
  },
];

export function LeaderboardPage({
  authLoading = false,
  leaderboards,
  onSignIn,
  signedIn,
}: {
  authLoading?: boolean;
  leaderboards: LeaderboardSet;
  onSignIn: () => void | Promise<void>;
  signedIn: boolean;
}) {
  const [activeBoard, setActiveBoard] = useState<BoardKey>("global");
  const board = BOARDS.find((item) => item.key === activeBoard) ?? BOARDS[0];

  if (!signedIn) {
    return (
      <AuthRequired
        loading={authLoading}
        title={
          authLoading
            ? "Vérification de ta session."
            : "Connecte-toi pour voir le classement."
        }
        description="Le classement global est lié à ton compte pour éviter les scores anonymes et additionner tes points."
        eyebrow="Classement"
      />
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_320px]">
      <section>
        <SectionKicker>Classement</SectionKicker>
        <h2 className="mt-2 text-4xl font-black">{board.title}</h2>
        <p className="mt-2 text-[#d7dadc]">{board.description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {BOARDS.map((item) => (
            <button
              className={`rounded-md px-3 py-2 text-sm font-bold transition ${
                item.key === activeBoard
                  ? "bg-[#f8f8f8] text-[#121213]"
                  : "bg-[#18191b] text-[#d7dadc] hover:bg-[#272729]"
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
            emptyLabel={board.emptyLabel}
            large
            leaderboard={leaderboards[activeBoard]}
          />
        </div>
      </section>
      <Panel className="h-fit">
        <SectionKicker>Score</SectionKicker>
        <div className="mt-4 space-y-3 text-sm leading-6 text-[#d7dadc]">
          <p>Le mot du jour rapporte jusqu'à 900 points.</p>
          <p>Le mode libre rapporte jusqu'à 360 points par manche.</p>
          <p>Mastermind rapporte jusqu'à 560 points par code trouvé.</p>
          <p>Le classement global additionne toutes les victoires de l'app.</p>
        </div>
      </Panel>
    </div>
  );
}
