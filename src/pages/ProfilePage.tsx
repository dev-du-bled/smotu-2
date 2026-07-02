import type { UseShooAuthResult } from "@shoojs/react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { ProfileStats } from "../../shared/game";
import { AuthRequired } from "../components/AuthRequired";
import { Button, Panel, SectionKicker, Skeleton } from "../components/ui";

function StatBox({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-md bg-[#272729] p-4">
      <p className="font-mono text-3xl font-black">{value}</p>
      <p className="mt-1 text-sm text-[#818384]">{label}</p>
    </div>
  );
}

function displayName(auth: UseShooAuthResult, stats: ProfileStats): string {
  return auth.claims?.name || stats.userName || "Joueur Smotu";
}

function displayEmail(auth: UseShooAuthResult): string {
  return auth.claims?.email || "Email non partage";
}

function displayPicture(auth: UseShooAuthResult): string {
  return auth.claims?.picture || "";
}

function shortUserId(userId: string | undefined): string {
  if (!userId) {
    return "Session inconnue";
  }

  return `${userId.slice(0, 8)}...${userId.slice(-6)}`;
}

function ProfileAvatar({ name, picture }: { name: string; picture: string }) {
  const [failed, setFailed] = useState(false);
  const initial = name.slice(0, 1).toUpperCase();

  if (picture && !failed) {
    return (
      <img
        alt={`Photo de profil de ${name}`}
        className="size-16 shrink-0 rounded-md border-2 border-[#f97316]/70 bg-[#272729] object-cover"
        referrerPolicy="no-referrer"
        src={picture}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className="grid size-16 shrink-0 place-items-center rounded-md border-2 border-[#f97316]/70 bg-[#538d4e] text-4xl font-black text-white">
      {initial}
    </div>
  );
}

export function ProfilePage({
  auth,
  authLoading = false,
  loading,
  onSignIn,
  stats,
  signedIn,
}: {
  auth: UseShooAuthResult;
  authLoading?: boolean;
  loading: boolean;
  onSignIn: () => void | Promise<void>;
  stats: ProfileStats;
  signedIn: boolean;
}) {
  if (!signedIn) {
    return (
      <AuthRequired
        loading={authLoading}
        title={
          authLoading
            ? "Verification de ta session."
            : "Connecte-toi pour voir ton profil."
        }
        description="Ton profil regroupe ton identite Shoo, ton score global et tes victoires sur Smotu."
        eyebrow="Profil"
        onSignIn={onSignIn}
      />
    );
  }

  const rank = stats.rank ? `#${stats.rank}` : "Non classe";
  const lastScore = stats.lastScoredAt
    ? new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(stats.lastScoredAt))
    : "Aucun score";
  const name = displayName(auth, stats);
  const picture = displayPicture(auth);

  return (
    <div className="mx-auto grid min-h-[inherit] max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[360px_1fr]">
      <Panel className="h-fit space-y-5">
        <div className="flex items-center gap-4">
          <ProfileAvatar name={name} picture={picture} />
          <div className="min-w-0">
            <SectionKicker>Profil</SectionKicker>
            <h2 className="mt-1 truncate text-3xl font-black">{name}</h2>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="rounded-md border border-[#2f3033] p-3">
            <p className="text-[#818384]">Google</p>
            <p className="mt-1 truncate font-semibold text-[#d7dadc]">
              {displayEmail(auth)}
            </p>
          </div>
          <div className="rounded-md border border-[#2f3033] p-3">
            <p className="text-[#818384]">Identifiant Shoo</p>
            <p className="mt-1 font-mono text-xs font-semibold text-[#d7dadc]">
              {shortUserId(auth.identity.userId ?? undefined)}
            </p>
          </div>
        </div>

        <Button
          className="w-full"
          type="button"
          variant="secondary"
          onClick={() => auth.clearIdentity()}
        >
          Se deconnecter
        </Button>
      </Panel>

      <section className="space-y-6">
        <div>
          <SectionKicker>Score</SectionKicker>
          <h3 className="mt-2 text-4xl font-black">Tableau personnel</h3>
          <p className="mt-2 max-w-2xl text-[#d7dadc]">
            Les points viennent du mot du jour et du mode libre. Le classement
            utilise le total de toutes tes victoires.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatBox label="Score total" value={stats.totalScore} />
            <StatBox label="Rang global" value={rank} />
            <StatBox label="Victoires" value={stats.gamesSolved} />
            <StatBox label="Dernier score" value={lastScore} />
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Panel className="space-y-4">
            <SectionKicker>Mot du jour</SectionKicker>
            <p className="font-mono text-4xl font-black">{stats.dailyScore}</p>
            <p className="text-sm text-[#818384]">
              {stats.dailySolved}{" "}
              {stats.dailySolved > 1 ? "victoires" : "victoire"} quotidienne.
            </p>
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md bg-[#538d4e] px-4 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#5f9b59]"
              to="/play"
            >
              Jouer
            </Link>
          </Panel>

          <Panel className="space-y-4">
            <SectionKicker>Mode libre</SectionKicker>
            <p className="font-mono text-4xl font-black">{stats.endlessScore}</p>
            <p className="text-sm text-[#818384]">
              {stats.endlessSolved}{" "}
              {stats.endlessSolved > 1 ? "victoires" : "victoire"} libres.
            </p>
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md bg-[#b59f3b] px-4 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#c4ad46]"
              to="/endless"
            >
              Lancer
            </Link>
          </Panel>
        </div>
      </section>
    </div>
  );
}
