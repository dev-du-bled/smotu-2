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

const previewRows = [
  [
    { letter: "S", className: "bg-success text-success-foreground border-success" },
    { letter: "M", className: "bg-warning text-warning-foreground border-warning" },
    { letter: "O", className: "bg-card text-foreground border-input" },
    { letter: "T", className: "bg-success text-success-foreground border-success" },
    { letter: "U", className: "bg-card text-foreground border-input" },
  ],
  [
    { letter: "M", className: "bg-card text-foreground border-input" },
    { letter: "A", className: "bg-success text-success-foreground border-success" },
    { letter: "G", className: "bg-card text-foreground border-input" },
    { letter: "I", className: "bg-warning text-warning-foreground border-warning" },
    { letter: "E", className: "bg-card text-foreground border-input" },
  ],
  [
    { letter: "J", className: "bg-purple text-purple-foreground border-purple" },
    { letter: "O", className: "bg-purple text-purple-foreground border-purple" },
    { letter: "U", className: "bg-purple text-purple-foreground border-purple" },
    { letter: "E", className: "bg-purple text-purple-foreground border-purple" },
    { letter: "R", className: "bg-purple text-purple-foreground border-purple" },
  ],
];

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
  const completionPercentage = Math.round(
    (game.attempts.length / game.maxAttempts) * 100,
  );
  const modes = [
    {
      accent: "bg-success",
      border: "border-success/30",
      cta: "Lancer la grille",
      href: "/play",
      label: "Mot du jour",
      meta: "Une énigme commune chaque jour, score maximal à protéger.",
    },
    {
      accent: "bg-warning",
      border: "border-warning/30",
      cta: "Enchaîner",
      href: "/endless",
      label: "Mode libre",
      meta: "Des mots jusqu'à 8 lettres pour progresser sans attendre demain.",
    },
    {
      accent: "bg-orange",
      border: "border-orange/30",
      cta: "Faire un sprint",
      href: "/timed",
      label: "Chrono 120s",
      meta: "Trouve un maximum de mots avant la fin du compte à rebours.",
    },
    {
      accent: "bg-purple",
      border: "border-purple/30",
      cta: "Casser le code",
      href: "/mastermind",
      label: "Mastermind",
      meta: "Déduis la bonne combinaison de couleurs et optimise tes coups.",
    },
  ];

  return (
    <div className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgb(83_141_78_/_0.20),transparent_30%),radial-gradient(circle_at_85%_10%,rgb(168_85_247_/_0.18),transparent_28%),radial-gradient(circle_at_60%_85%,rgb(181_159_59_/_0.18),transparent_34%)]" />
      <div className="mx-auto grid min-h-[inherit] max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
        <section>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground shadow-sm">
            <span className="size-2 rounded-full bg-success" />
            Nouveau hub de jeux de mots
          </div>
          <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.9] tracking-tight sm:text-7xl lg:text-8xl">
            Devine. Déduis. Domine le classement.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-subtle-foreground sm:text-xl">
            Smotu rassemble quatre défis rapides: une grille quotidienne, un mode
            libre pour s'entraîner, un sprint chrono de 120s et un Mastermind
            coloré. Gagne des points, collectionne des smotucoins et grimpe
            devant tes amis.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              className="inline-flex h-14 items-center justify-center rounded-xl bg-primary px-6 text-base font-black uppercase tracking-wide text-primary-foreground shadow-lg shadow-primary/10 transition hover:-translate-y-0.5 hover:opacity-90"
              to="/play"
            >
              Jouer maintenant
            </Link>
            <Link
              className="inline-flex h-14 items-center justify-center rounded-xl border border-border bg-card px-6 text-base font-black uppercase tracking-wide text-foreground transition hover:-translate-y-0.5 hover:bg-card-hover"
              to="/leaderboard"
            >
              Voir le classement
            </Link>
          </div>

          <div className="mt-10 grid max-w-3xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {modes.map((mode) => (
              <Link
                className={`group rounded-2xl border ${mode.border} bg-card/85 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl`}
                key={mode.href}
                to={mode.href}
              >
                <span className={`mb-4 block size-3 rounded-full ${mode.accent}`} />
                <span className="block text-lg font-black">{mode.label}</span>
                <span className="mt-2 block min-h-14 text-sm leading-6 text-muted-foreground">
                  {mode.meta}
                </span>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-black uppercase tracking-wide text-subtle-foreground">
                  {mode.cta}
                  <span className="transition group-hover:translate-x-1">→</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <Panel className="overflow-hidden p-0 shadow-2xl shadow-primary/10">
            <div className="border-b border-border bg-primary p-5 text-primary-foreground">
              <SectionKicker>Partie du jour</SectionKicker>
              <div className="mt-3 flex items-end justify-between gap-4">
                <p className="text-3xl font-black capitalize leading-none">
                  {formatDateKey(game.dateKey)}
                </p>
                <p className="rounded-full bg-primary-foreground/15 px-3 py-1 font-mono text-sm font-black">
                  {completionPercentage}%
                </p>
              </div>
            </div>

            <div className="grid gap-6 p-5 sm:p-6">
              <div className="grid grid-cols-5 gap-2" aria-hidden="true">
                {previewRows.flatMap((row, rowIndex) =>
                  row.map((tile, tileIndex) => (
                    <span
                      className={`grid aspect-square place-items-center rounded-lg border-2 text-xl font-black shadow-sm sm:text-2xl ${tile.className}`}
                      key={`${rowIndex}-${tileIndex}`}
                    >
                      {tile.letter}
                    </span>
                  )),
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-muted p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Progression
                  </p>
                  <p className="mt-2 font-mono text-3xl font-black leading-none">
                    {game.attempts.length}/{game.maxAttempts}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {attemptsLabel} utilisés
                  </p>
                </div>
                <div className="rounded-2xl bg-muted p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Joueurs
                  </p>
                  {leaderboardLoading ? (
                    <Skeleton className="mt-2 h-9 w-20" />
                  ) : (
                    <p className="mt-2 font-mono text-3xl font-black leading-none">
                      {leaderboardCount}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-muted-foreground">au classement</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Champion actuel
                </p>
                {leaderboardLoading ? (
                  <Skeleton className="mt-3 h-14 w-full" />
                ) : topPlayer ? (
                  <div className="mt-3 flex items-center gap-3">
                    <AvatarDisplay
                      avatar={topPlayer.publicAvatar}
                      label={`Avatar de ${topPlayer.userName}`}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xl font-black leading-tight">
                        {topPlayer.userName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        À battre sur le classement global
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-lg font-black text-muted-foreground">
                    Personne en tête pour l'instant — prends la place.
                  </p>
                )}
              </div>
            </div>
          </Panel>

          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              className="rounded-2xl border border-border bg-card/85 p-5 transition hover:-translate-y-1 hover:bg-card-hover"
              to="/shop"
            >
              <span className="text-2xl">🪙</span>
              <p className="mt-2 text-lg font-black">Boutique</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Débloque avatars, thèmes et bonus avec tes smotucoins.
              </p>
            </Link>
            <Link
              className="rounded-2xl border border-border bg-card/85 p-5 transition hover:-translate-y-1 hover:bg-card-hover"
              to="/players"
            >
              <span className="text-2xl">🤝</span>
              <p className="mt-2 text-lg font-black">Communauté</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Retrouve les joueurs, ajoute tes amis et compare vos scores.
              </p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
