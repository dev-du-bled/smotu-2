import { Link } from "react-router-dom";
import type { GameState, GlobalLeaderboardEntry } from "../../shared/game";
import { AvatarDisplay } from "../components/AvatarDisplay";
import { Panel, SectionKicker, Skeleton } from "../components/ui";

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
  game,
  leaderboardCount,
  leaderboardLoading = false,
  topPlayer,
}: {
  game: GameState;
  leaderboardCount: number;
  leaderboardLoading?: boolean;
  topPlayer: GlobalLeaderboardEntry | null;
}) {
  const attemptsLabel = game.attempts.length > 1 ? "essais" : "essai";
  const modes = [
    {
      dot: "bg-success",
      href: "/play",
      label: "Mot du jour",
      meta: "Grille quotidienne",
      score: 900,
    },
    {
      dot: "bg-warning",
      href: "/endless",
      label: "Mode libre",
      meta: "Max sur 8 lettres",
      score: 560,
    },
    {
      dot: "bg-orange",
      href: "/timed",
      label: "Chrono 120s",
      meta: "Max de mots",
      score: 120,
    },
    {
      dot: "bg-purple",
      href: "/mastermind",
      label: "Mastermind",
      meta: "Code couleur",
      score: 560,
    },
  ];

  return (
    <div className="mx-auto grid min-h-[inherit] max-w-6xl items-center gap-8 px-4 py-10 lg:grid-cols-[1fr_380px]">
      <section>
        <SectionKicker>Smotu</SectionKicker>
        <h2 className="mt-4 max-w-3xl text-5xl font-black leading-[0.95] sm:text-7xl">
          Devine le mot. Marque des points.
        </h2>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-subtle-foreground">
          Quatre jeux, quatre rythmes: le mot du jour, le mode libre, le
          chrono 120s et Mastermind. Les propositions restent libres, les points changent selon
          le mode et le classement additionne tout.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="inline-flex h-12 items-center justify-center rounded-md bg-success px-5 text-base font-bold uppercase tracking-wide text-success-foreground transition hover:bg-success-hover"
            to="/play"
          >
            Jouer au mot du jour
          </Link>
          <Link
            className="inline-flex h-12 items-center justify-center rounded-md bg-warning px-5 text-base font-bold uppercase tracking-wide text-warning-foreground transition hover:bg-warning-hover"
            to="/endless"
          >
            Mode libre
          </Link>
          <Link
            className="inline-flex h-12 items-center justify-center rounded-md bg-orange px-5 text-base font-bold uppercase tracking-wide text-orange-foreground transition hover:bg-orange-hover"
            to="/timed"
          >
            Chrono 120s
          </Link>
          <Link
            className="inline-flex h-12 items-center justify-center rounded-md bg-purple px-5 text-base font-bold uppercase tracking-wide text-purple-foreground transition hover:bg-purple-hover"
            to="/mastermind"
          >
            Mastermind
          </Link>
          <Link
            className="inline-flex h-12 items-center justify-center rounded-md bg-secondary px-5 text-base font-bold uppercase tracking-wide text-secondary-foreground transition hover:bg-secondary-hover"
            to="/leaderboard"
          >
            Voir le classement
          </Link>
        </div>
      </section>

      <Panel className="space-y-5 p-5 sm:p-6">
        <div className="border-b border-border pb-5">
          <SectionKicker>Aujourd'hui</SectionKicker>
          <p className="mt-2 text-3xl font-black capitalize leading-none">
            {formatDateKey(game.dateKey)}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {game.attempts.length}/{game.maxAttempts} {attemptsLabel} utilisés
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 border-b border-border pb-5">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Champion
            </p>
            {leaderboardLoading ? (
              <Skeleton className="mt-1 h-12 w-full" />
            ) : topPlayer ? (
              <div className="mt-1 flex items-center gap-2">
                <AvatarDisplay
                  avatar={topPlayer.publicAvatar}
                  label={`Avatar de ${topPlayer.userName}`}
                  size="sm"
                />
                <span className="min-w-0 truncate text-lg font-black leading-tight">
                  {topPlayer.userName}
                </span>
              </div>
            ) : (
              <p className="mt-1 text-4xl font-black leading-none text-muted-foreground">—</p>
            )}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Joueurs
            </p>
            {leaderboardLoading ? (
              <Skeleton className="mt-1 h-10 w-16" />
            ) : (
              <p className="mt-1 font-mono text-4xl font-black leading-none">
                {leaderboardCount}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Modes
          </p>
          <div className="overflow-hidden rounded-md border border-border">
            {modes.map((mode) => (
              <Link
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-border bg-card px-3 py-3 transition last:border-b-0 hover:bg-card-hover"
                key={mode.href}
                to={mode.href}
              >
                <span className={`size-2.5 rounded-full ${mode.dot}`} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black text-foreground">
                    {mode.label}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {mode.meta}
                  </span>
                </span>
                <span className="rounded bg-muted px-2 py-1 font-mono text-xs font-black tabular-nums text-subtle-foreground">
                  {mode.score} pts
                </span>
              </Link>
            ))}
          </div>
        </div>
      </Panel>
    </div>
  );
}
