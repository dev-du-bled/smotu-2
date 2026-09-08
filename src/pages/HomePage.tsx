import { Link } from "react-router-dom";
import type { GameState, GlobalLeaderboardEntry } from "../../shared/game";
import { AvatarDisplay } from "../components/AvatarDisplay";
import { Skeleton } from "../components/ui";

function formatDateKey(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) return "aujourd’hui";
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" })
    .format(new Date(year, month - 1, day));
}

const modes = [
  { code: "01", href: "/play", label: "Le mot du jour", note: "Même mot pour tout le monde", tone: "bg-success" },
  { code: "02", href: "/endless", label: "Libre", note: "4 à 8 lettres, sans limite", tone: "bg-warning" },
  { code: "03", href: "/blitz", label: "Blitz", note: "60 secondes · 4 essais", tone: "bg-orange" },
  { code: "04", href: "/timed", label: "Chrono", note: "120 secondes · 6 essais", tone: "bg-orange" },
  { code: "05", href: "/marathon", label: "Marathon", note: "180 secondes · 8 essais", tone: "bg-success" },
  { code: "06", href: "/mastermind", label: "Mastermind", note: "Le code couleur", tone: "bg-purple" },
] as const;

function SmotuMascot() {
  return (
    <div className="smotu-mascot" aria-hidden="true">
      <div className="smotu-mascot-shadow" />
      <div className="smotu-mascot-body">
        <span className="smotu-eye smotu-eye-left"><i /></span>
        <span className="smotu-eye smotu-eye-right"><i /></span>
        <span className="smotu-smile" />
        <span className="smotu-cheek smotu-cheek-left" />
        <span className="smotu-cheek smotu-cheek-right" />
      </div>
      <div className="smotu-tile smotu-tile-s">S</div>
      <div className="smotu-tile smotu-tile-m">M</div>
      <div className="smotu-tile smotu-tile-o">O</div>
      <div className="smotu-spark">✦</div>
    </div>
  );
}

export function HomePage({ game, leaderboardCount, leaderboardLoading = false, topPlayer }: {
  game: GameState;
  leaderboardCount: number;
  leaderboardLoading?: boolean;
  topPlayer: GlobalLeaderboardEntry | null;
}) {
  const remaining = Math.max(0, game.maxAttempts - game.attempts.length);

  return (
    <main className="overflow-hidden bg-[#f3eddf] text-[#18231a]">
      <section className="relative mx-auto grid min-h-[680px] max-w-7xl items-center gap-4 px-5 py-12 md:grid-cols-[1.1fr_.9fr] md:px-10 lg:py-20">
        <div className="relative z-10">
          <p className="mb-5 font-mono text-sm font-bold uppercase tracking-[.22em] text-[#55705a]">
            {formatDateKey(game.dateKey)} · grille ouverte
          </p>
          <h1 className="max-w-4xl font-black leading-[.82] tracking-[-.075em] text-[#18231a] text-[clamp(4.5rem,10vw,9.5rem)]">
            Trouve<br /><span className="text-[#e6532f]">le mot.</span>
          </h1>
          <p className="mt-8 max-w-lg text-lg font-medium leading-7 text-[#465448]">
            Six façons de jouer avec les lettres. Pas de tutoriel interminable :
            six essais, un clavier, et ton instinct.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link className="home-play-button" to="/play">Jouer la grille <span>→</span></Link>
            <span className="font-mono text-sm text-[#637066]">
              {game.over ? (game.solved ? "Trouvé aujourd’hui ✓" : "À demain") : `${remaining} essais restants`}
            </span>
          </div>
        </div>

        <div className="relative min-h-[400px] md:min-h-[560px]">
          <p className="absolute right-0 top-4 z-20 max-w-40 rotate-3 border-2 border-[#18231a] bg-[#f8d84a] p-3 text-center font-mono text-xs font-black uppercase shadow-[5px_5px_0_#18231a]">
            Réfléchit parfois.<br />Sourit toujours.
          </p>
          <SmotuMascot />
        </div>
        <span className="pointer-events-none absolute -bottom-8 -left-4 select-none font-black text-[10rem] leading-none text-[#18231a]/[.035] md:text-[18rem]">SMOTU</span>
      </section>

      <section className="border-y-2 border-[#18231a] bg-[#18231a] text-[#f3eddf]">
        <div className="mx-auto grid max-w-7xl md:grid-cols-[.72fr_1.28fr]">
          <div className="border-b border-[#f3eddf]/20 p-6 md:border-b-0 md:border-r md:p-10">
            <p className="font-mono text-xs uppercase tracking-[.2em] text-[#acc5ad]">Choisis ton rythme</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Six jeux.<br />Une obsession.</h2>
          </div>
          <nav className="grid sm:grid-cols-2" aria-label="Modes de jeu">
            {modes.map((mode) => (
              <Link className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-[#f3eddf]/20 p-5 transition hover:bg-[#263529] sm:odd:border-r" key={mode.href} to={mode.href}>
                <span className="font-mono text-xs text-[#8da18f]">{mode.code}</span>
                <span><strong className="block text-xl">{mode.label}</strong><small className="text-[#aab5ab]">{mode.note}</small></span>
                <span className={`grid size-9 place-items-center rounded-full ${mode.tone} text-white transition-transform group-hover:rotate-[-12deg] group-hover:scale-110`}>↗</span>
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-3 md:px-10 md:py-24">
        <div className="md:col-span-2">
          <p className="font-mono text-xs font-bold uppercase tracking-[.2em] text-[#55705a]">Aujourd’hui sur Smotu</p>
          <div className="mt-5 flex flex-wrap gap-x-12 gap-y-6 border-t-2 border-[#18231a] pt-6">
            <div><strong className="block text-5xl font-black">{game.attempts.length}/{game.maxAttempts}</strong><span className="text-sm text-[#637066]">essais joués</span></div>
            <div>{leaderboardLoading ? <Skeleton className="h-14 w-28" /> : <strong className="block text-5xl font-black">{leaderboardCount}</strong>}<span className="text-sm text-[#637066]">joueurs classés</span></div>
          </div>
          <div className="mt-12 grid grid-cols-5 gap-2 sm:max-w-md">
            {["S", "M", "O", "T", "U"].map((letter, index) => <span className={`grid aspect-square place-items-center border-2 border-[#18231a] text-2xl font-black shadow-[3px_3px_0_#18231a] ${index === 0 || index === 3 ? "bg-[#72a66d]" : index === 1 ? "bg-[#f8d84a]" : "bg-[#fffaf0]"}`} key={letter}>{letter}</span>)}
          </div>
        </div>

        <aside className="self-start border-2 border-[#18231a] bg-[#fffaf0] p-5 shadow-[7px_7px_0_#e6532f]">
          <p className="font-mono text-xs font-bold uppercase tracking-[.18em] text-[#55705a]">En tête du classement</p>
          {leaderboardLoading ? <Skeleton className="mt-5 h-16 w-full" /> : topPlayer ? (
            <div className="mt-5 flex items-center gap-4">
              <AvatarDisplay avatar={topPlayer.publicAvatar} label={`Avatar de ${topPlayer.userName}`} size="md" />
              <div className="min-w-0"><strong className="block truncate text-2xl">{topPlayer.userName}</strong><span className="font-mono text-sm">{topPlayer.totalScore.toLocaleString("fr-FR")} points</span></div>
            </div>
          ) : <p className="mt-5 text-xl font-bold">Le fauteuil est libre. Pour l’instant.</p>}
          <Link className="mt-6 inline-block border-b-2 border-[#18231a] font-bold" to="/leaderboard">Voir tout le classement →</Link>
        </aside>
      </section>
    </main>
  );
}
