import type { GlobalLeaderboardEntry } from "../../shared/game";
import { AuthRequired } from "../components/AuthRequired";
import { LeaderboardList } from "../components/LeaderboardList";
import { Panel, SectionKicker } from "../components/ui";

export function LeaderboardPage({
  authLoading = false,
  leaderboard,
  onSignIn,
  signedIn,
}: {
  authLoading?: boolean;
  leaderboard: GlobalLeaderboardEntry[];
  onSignIn: () => void | Promise<void>;
  signedIn: boolean;
}) {
  if (!signedIn) {
    return (
      <AuthRequired
        loading={authLoading}
        title={
          authLoading
            ? "Vérification de ta session."
            : "Connecte-toi pour voir le classement."
        }
        description="Le classement global est lié aux comptes Google pour éviter les scores anonymes et additionner tes points."
        eyebrow="Classement"
        onSignIn={onSignIn}
      />
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_320px]">
      <section>
        <SectionKicker>Classement</SectionKicker>
        <h2 className="mt-2 text-4xl font-black">Top global</h2>
        <div className="mt-6">
          <LeaderboardList large leaderboard={leaderboard} />
        </div>
      </section>
      <Panel className="h-fit">
        <SectionKicker>Score</SectionKicker>
        <div className="mt-4 space-y-3 text-sm leading-6 text-[#d7dadc]">
          <p>Le mot du jour rapporte jusqu'à 900 points.</p>
          <p>Le mode libre rapporte jusqu'à 360 points par manche.</p>
          <p>Le classement additionne toutes les victoires de l'app.</p>
        </div>
      </Panel>
    </div>
  );
}
