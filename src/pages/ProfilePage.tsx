import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { ProfileStats } from "../../shared/game";
import { AuthRequired } from "../components/AuthRequired";
import { apiJson } from "../lib/api";
import type { AuthUser } from "../lib/auth";
import {
  Button,
  Input,
  Panel,
  PointsAmount,
  SectionKicker,
  Skeleton,
} from "../components/ui";

function StatBox({
  points = false,
  label,
  value,
}: {
  points?: boolean;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-md bg-muted p-4">
      {points ? (
        <PointsAmount
          className="text-3xl font-black"
          iconClassName="size-7"
          value={value}
        />
      ) : (
        <p className="font-mono text-3xl font-black">{value}</p>
      )}
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function displayName(stats: ProfileStats): string {
  return stats.userName || "Joueur Smotu";
}

function displayEmail(user: AuthUser | undefined): string {
  return user?.email || "Email non partage";
}

function displayPicture(user: AuthUser | undefined): string {
  return user?.image || "";
}

function ProfileAvatar({ name, picture }: { name: string; picture: string }) {
  const [failed, setFailed] = useState(false);
  const initial = name.slice(0, 1).toUpperCase();

  if (picture && !failed) {
    return (
      <img
        alt={`Photo de profil de ${name}`}
        className="size-16 shrink-0 rounded-md border-2 border-orange/70 bg-muted object-cover"
        referrerPolicy="no-referrer"
        src={picture}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className="grid size-16 shrink-0 place-items-center rounded-md border-2 border-orange/70 bg-success text-4xl font-black text-success-foreground">
      {initial}
    </div>
  );
}

function UsernameForm({
  currentName,
  onSaved,
}: {
  currentName: string;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const trimmedValue = value.trim();
  const unchanged = trimmedValue === currentName.trim();

  useEffect(() => {
    setValue(currentName);
  }, [currentName]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!trimmedValue || unchanged) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await apiJson("/api/profile/username", {
        method: "POST",
        body: JSON.stringify({ username: trimmedValue }),
      });
      setEditing(false);
      setMessage("Pseudo mis à jour.");
      onSaved();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="space-y-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Pseudo public
          </p>
          <p className="mt-1 truncate text-lg font-black text-foreground">
            {currentName}
          </p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            Visible dans le classement.
          </p>
        </div>
        <Button
          className="w-full"
          size="sm"
          type="button"
          variant="secondary"
          onClick={() => {
            setValue(currentName);
            setMessage("");
            setEditing(true);
          }}
        >
          Modifier le pseudo
        </Button>
        {message ? (
          <p className="text-xs font-semibold text-success">{message}</p>
        ) : null}
      </div>
    );
  }

  return (
    <form className="space-y-3" onSubmit={save}>
      <label
        className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground"
        htmlFor="username"
      >
        Nouveau pseudo
      </label>
      <Input
        className="w-full text-base font-semibold normal-case"
        id="username"
        maxLength={20}
        name="username"
        placeholder="Ton pseudo"
        value={value}
        onChange={(event) => setValue(event.currentTarget.value)}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          disabled={saving || !trimmedValue || unchanged}
          size="sm"
          type="submit"
          variant="success"
        >
          {saving ? "Enregistrement..." : "Enregistrer"}
        </Button>
        <Button
          disabled={saving}
          size="sm"
          type="button"
          variant="ghost"
          onClick={() => {
            setValue(currentName);
            setMessage("");
            setEditing(false);
          }}
        >
          Annuler
        </Button>
      </div>
      {message ? (
        <p className="text-xs font-semibold text-destructive">{message}</p>
      ) : null}
    </form>
  );
}

export function ProfilePage({
  authLoading = false,
  loading,
  onSignIn,
  onSignOut,
  refetch,
  stats,
  signedIn,
  user,
}: {
  authLoading?: boolean;
  loading: boolean;
  onSignIn: () => void | Promise<void>;
  onSignOut: () => void | Promise<void>;
  refetch?: () => void;
  stats: ProfileStats;
  signedIn: boolean;
  user?: AuthUser;
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
        description="Ton profil regroupe ton compte, ton score global et tes victoires sur Smotu."
        eyebrow="Profil"
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
  const name = displayName(stats);
  const picture = displayPicture(user);

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
          {signedIn ? (
            <div className="rounded-md border border-border p-3">
              <UsernameForm
                currentName={stats.userName}
                onSaved={() => refetch?.()}
              />
            </div>
          ) : null}
          <div className="rounded-md border border-border p-3">
            <p className="text-muted-foreground">Compte</p>
            <p className="mt-1 truncate font-semibold text-subtle-foreground">
              {displayEmail(user)}
            </p>
          </div>
        </div>

        <Button
          className="w-full"
          type="button"
          variant="secondary"
          onClick={() => void onSignOut()}
        >
          Se deconnecter
        </Button>
      </Panel>

      <section className="space-y-6">
        <div>
          <SectionKicker>Score</SectionKicker>
          <h3 className="mt-2 text-4xl font-black">Tableau personnel</h3>
          <p className="mt-2 max-w-2xl text-subtle-foreground">
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
            <StatBox label="Score total" points value={stats.totalScore} />
            <StatBox label="Rang global" value={rank} />
            <StatBox label="Victoires" value={stats.gamesSolved} />
            <StatBox label="Dernier score" value={lastScore} />
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Panel className="space-y-4">
            <SectionKicker>Mot du jour</SectionKicker>
            {loading ? (
              <Skeleton className="h-10 w-28" />
            ) : (
              <PointsAmount
                className="text-4xl font-black"
                iconClassName="size-8"
                value={stats.dailyScore}
              />
            )}
            {loading ? (
              <Skeleton className="h-4 w-40" />
            ) : (
              <p className="text-sm text-muted-foreground">
                {stats.dailySolved}{" "}
                {stats.dailySolved > 1 ? "victoires" : "victoire"} quotidienne.
              </p>
            )}
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md bg-success px-4 text-sm font-bold uppercase tracking-wide text-success-foreground transition hover:bg-success-hover"
              to="/play"
            >
              Jouer
            </Link>
          </Panel>

          <Panel className="space-y-4">
            <SectionKicker>Mode libre</SectionKicker>
            {loading ? (
              <Skeleton className="h-10 w-28" />
            ) : (
              <PointsAmount
                className="text-4xl font-black"
                iconClassName="size-8"
                value={stats.endlessScore}
              />
            )}
            {loading ? (
              <Skeleton className="h-4 w-40" />
            ) : (
              <p className="text-sm text-muted-foreground">
                {stats.endlessSolved}{" "}
                {stats.endlessSolved > 1 ? "victoires" : "victoire"} libres.
              </p>
            )}
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md bg-warning px-4 text-sm font-bold uppercase tracking-wide text-warning-foreground transition hover:bg-warning-hover"
              to="/endless"
            >
              Jouer
            </Link>
          </Panel>

          <Panel className="space-y-4">
            <SectionKicker>Mastermind</SectionKicker>
            {loading ? (
              <Skeleton className="h-10 w-28" />
            ) : (
              <PointsAmount
                className="text-4xl font-black"
                iconClassName="size-8"
                value={stats.mastermindScore}
              />
            )}
            {loading ? (
              <Skeleton className="h-4 w-40" />
            ) : (
              <p className="text-sm text-muted-foreground">
                {stats.mastermindSolved}{" "}
                {stats.mastermindSolved > 1 ? "victoires" : "victoire"} Mastermind.
              </p>
            )}
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md bg-purple px-4 text-sm font-bold uppercase tracking-wide text-purple-foreground transition hover:bg-purple-hover"
              to="/mastermind"
            >
              Jouer
            </Link>
          </Panel>
        </div>
      </section>
    </div>
  );
}
