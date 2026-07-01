import {
  SignInWithGoogle,
  signOut,
  useAuth,
  useMutation,
  useQuery,
} from "lakebed/client";
import { useState } from "preact/hooks";
import {
  Badge,
  Button,
  Input,
  KeyCap,
  LogoMark,
  Panel,
  ProgressStrip,
  RankMedal,
  SectionKicker,
  Shell,
  Surface,
  WordTile,
} from "./components/ui";
import {
  MAX_ATTEMPTS,
  normalizeGuess,
  WORDS,
  WORD_LENGTH,
  type Attempt,
  type GameState,
  type LeaderboardEntry,
  type TileState,
} from "../shared/game";

type Page = "home" | "play" | "leaderboard";

const emptyGame: GameState = {
  dateKey: "",
  attempts: [],
  maxAttempts: MAX_ATTEMPTS,
  wordLength: WORD_LENGTH,
  solved: false,
  over: false,
  answer: "",
};

const KEY_ROWS = ["AZERTYUIOP", "QSDFGHJKLM", "WXCVBN"];

function normalizeGame(value: Partial<GameState> | undefined): GameState {
  return {
    dateKey: value?.dateKey ?? emptyGame.dateKey,
    attempts: Array.isArray(value?.attempts) ? value.attempts : [],
    maxAttempts:
      typeof value?.maxAttempts === "number"
        ? value.maxAttempts
        : emptyGame.maxAttempts,
    wordLength:
      typeof value?.wordLength === "number"
        ? value.wordLength
        : emptyGame.wordLength,
    solved: Boolean(value?.solved),
    over: Boolean(value?.over),
    answer: value?.answer ?? "",
  };
}

function wordLetters(value: string): string[] {
  const list = value.split("");
  return Array.from({ length: WORD_LENGTH }, (_, index) => list[index] ?? "");
}

function letterStates(attempts: Attempt[]): Record<string, TileState> {
  const priority: Record<TileState, number> = {
    absent: 1,
    present: 2,
    correct: 3,
  };
  const states: Record<string, TileState> = {};

  for (const attempt of attempts) {
    attempt.guess.split("").forEach((letter, index) => {
      const next = attempt.pattern[index];
      const current = states[letter];
      if (!current || priority[next] > priority[current]) {
        states[letter] = next;
      }
    });
  }

  return states;
}

function statusText(
  game: GameState,
  pendingGuess: string,
  solvedAttempt?: Attempt,
): string {
  const remaining = game.maxAttempts - game.attempts.length;
  if (pendingGuess) {
    return "Vérification du mot...";
  }
  if (game.solved) {
    const attempts = solvedAttempt?.attemptNumber ?? 0;
    return `Trouvé en ${attempts} ${attempts > 1 ? "essais" : "essai"}. Score: ${solvedAttempt?.score ?? 0}.`;
  }
  if (game.over) {
    return `Partie terminée. Le mot était ${game.answer}.`;
  }
  return `${remaining} ${remaining > 1 ? "essais restants" : "essai restant"}.`;
}

function NavButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`rounded-md px-3 py-2 text-sm font-bold transition ${
        active
          ? "bg-[#f8f8f8] text-[#121213]"
          : "text-[#d7dadc] hover:bg-[#272729]"
      }`}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Header({
  auth,
  dateKey,
  page,
  setPage,
}: {
  auth: ReturnType<typeof useAuth>;
  dateKey: string;
  page: Page;
  setPage: (page: Page) => void;
}) {
  return (
    <header className="border-b border-[#3a3a3c]">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <button
          className="flex items-center gap-3"
          type="button"
          onClick={() => setPage("home")}
        >
          <LogoMark />
          <div className="text-left">
            <h1 className="text-2xl font-black uppercase tracking-[0.08em]">
              Smotu
            </h1>
            <p className="text-xs font-semibold text-[#818384]">
              Le mot quotidien
            </p>
          </div>
        </button>

        <nav
          className="flex rounded-lg bg-[#18191b] p-1"
          aria-label="Navigation principale"
        >
          <NavButton active={page === "home"} onClick={() => setPage("home")}>
            Accueil
          </NavButton>
          <NavButton active={page === "play"} onClick={() => setPage("play")}>
            Mot du jour
          </NavButton>
          <NavButton
            active={page === "leaderboard"}
            onClick={() => setPage("leaderboard")}
          >
            Classement
          </NavButton>
        </nav>

        {!auth.isLoading && auth.isGuest ? (
          <SignInWithGoogle className="h-9 rounded-md bg-[#3a3a3c] px-3 text-sm font-bold text-white hover:bg-[#4a4a4d]">
            Se connecter
          </SignInWithGoogle>
        ) : !auth.isLoading ? (
          <Button
            size="sm"
            type="button"
            variant="secondary"
            onClick={() => signOut()}
          >
            Déconnexion
          </Button>
        ) : null}
      </div>
    </header>
  );
}

function LeaderboardList({
  leaderboard,
  large = false,
}: {
  leaderboard: LeaderboardEntry[];
  large?: boolean;
}) {
  return (
    <ol className="space-y-2">
      {leaderboard.length ? (
        leaderboard.map((entry, index) => (
          <li
            className={`flex items-center gap-3 rounded-md border border-[#2f3033] bg-[#18191b] ${
              large ? "p-4" : "p-3"
            }`}
            key={entry.userId}
          >
            <RankMedal index={index}>{index + 1}</RankMedal>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{entry.userName}</p>
              <p className="text-sm text-[#818384]">
                {entry.attempts} {entry.attempts > 1 ? "essais" : "essai"}
              </p>
            </div>
            <p className="font-mono text-lg font-black">{entry.score}</p>
          </li>
        ))
      ) : (
        <li className="rounded-md border border-dashed border-[#3a3a3c] p-5 text-sm text-[#818384]">
          Aucun joueur classé aujourd'hui.
        </li>
      )}
    </ol>
  );
}

function Keyboard({
  states,
  onLetter,
  onBackspace,
  onEnter,
}: {
  states: Record<string, TileState>;
  onLetter: (letter: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
}) {
  return (
    <div className="mx-auto grid w-full max-w-xl gap-2">
      {KEY_ROWS.map((row, rowIndex) => (
        <div className="flex justify-center gap-1.5" key={row}>
          {rowIndex === 2 ? (
            <button
              className="h-12 rounded bg-[#818384] px-3 text-xs font-black uppercase text-white"
              type="button"
              onClick={onEnter}
            >
              Valider
            </button>
          ) : null}
          {row.split("").map((letter) => (
            <KeyCap
              key={letter}
              state={states[letter]}
              onClick={() => onLetter(letter)}
            >
              {letter}
            </KeyCap>
          ))}
          {rowIndex === 2 ? (
            <button
              className="h-12 rounded bg-[#818384] px-3 text-xs font-black uppercase text-white"
              type="button"
              onClick={onBackspace}
            >
              Retour
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function GameBoard({
  activeRow,
  canSubmit,
  game,
  inputValue,
  localError,
  onBackspace,
  onInput,
  onLetter,
  onSubmit,
  pendingGuess,
  rows,
  solvedAttempt,
  states,
}: {
  activeRow: number;
  canSubmit: boolean;
  game: GameState;
  inputValue: string;
  localError: string;
  onBackspace: () => void;
  onInput: (value: string) => void;
  onLetter: (letter: string) => void;
  onSubmit: (event?: SubmitEvent) => void;
  pendingGuess: string;
  rows: Array<Attempt | undefined>;
  solvedAttempt?: Attempt;
  states: Record<string, TileState>;
}) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-5">
      <div className="w-full max-w-sm">
        <div className="grid gap-1.5">
          {rows.map((attempt, rowIndex) => {
            const pending = attempt?.id === "pending";
            const rowLetters = attempt
              ? wordLetters(attempt.guess)
              : rowIndex === activeRow
                ? wordLetters(inputValue)
                : Array.from({ length: WORD_LENGTH }, () => "");
            return (
              <div
                className="grid grid-cols-5 gap-1.5"
                key={attempt?.id ?? `empty-${rowIndex}`}
              >
                {rowLetters.map((letter, index) => (
                  <WordTile
                    active={rowIndex === activeRow}
                    key={`${rowIndex}-${index}`}
                    pending={pending}
                    state={attempt?.pattern[index]}
                  >
                    {letter}
                  </WordTile>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <form
        className="grid w-full max-w-sm grid-cols-[1fr_auto] gap-2"
        onSubmit={(event) => void onSubmit(event)}
      >
        <Input
          aria-label="Mot propose"
          autoComplete="off"
          disabled={game.over || Boolean(pendingGuess)}
          maxLength={WORD_LENGTH}
          name="guess"
          pattern="[A-Za-z]{5}"
          placeholder="OCEAN"
          value={inputValue}
          onInput={(event) =>
            onInput((event.currentTarget as HTMLInputElement).value)
          }
        />
        <Button disabled={!canSubmit} size="lg" type="submit" variant="success">
          Valider
        </Button>
      </form>

      <p className="min-h-6 text-center text-sm font-semibold text-[#d7dadc]">
        {localError || statusText(game, pendingGuess, solvedAttempt)}
      </p>

      <Keyboard
        states={states}
        onBackspace={onBackspace}
        onEnter={() => onSubmit()}
        onLetter={onLetter}
      />
    </div>
  );
}

function HomePage({
  bestScore,
  game,
  leaderboardCount,
  onGoLeaderboard,
  onGoPlay,
}: {
  bestScore: number;
  game: GameState;
  leaderboardCount: number;
  onGoLeaderboard: () => void;
  onGoPlay: () => void;
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
          <Button size="lg" variant="success" onClick={onGoPlay}>
            Jouer au mot du jour
          </Button>
          <Button size="lg" variant="secondary" onClick={onGoLeaderboard}>
            Voir le classement
          </Button>
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

function PlayPage({
  activeRow,
  canSubmit,
  game,
  inputValue,
  localError,
  onBackspace,
  onInput,
  onLetter,
  onSubmit,
  pendingGuess,
  progress,
  rows,
  solvedAttempt,
  states,
}: {
  activeRow: number;
  canSubmit: boolean;
  game: GameState;
  inputValue: string;
  localError: string;
  onBackspace: () => void;
  onInput: (value: string) => void;
  onLetter: (letter: string) => void;
  onSubmit: (event?: SubmitEvent) => void;
  pendingGuess: string;
  progress: number;
  rows: Array<Attempt | undefined>;
  solvedAttempt?: Attempt;
  states: Record<string, TileState>;
}) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-65px)] max-w-6xl grid-rows-[auto_1fr] px-4 py-5">
      <div className="mx-auto mb-5 w-full max-w-xl">
        <div className="mb-2 flex items-center justify-between text-sm text-[#818384]">
          <span>Progression</span>
          <span>
            {game.attempts.length}/{game.maxAttempts}
          </span>
        </div>
        <ProgressStrip value={progress} />
      </div>
      <GameBoard
        activeRow={activeRow}
        canSubmit={canSubmit}
        game={game}
        inputValue={inputValue}
        localError={localError}
        pendingGuess={pendingGuess}
        rows={rows}
        solvedAttempt={solvedAttempt}
        states={states}
        onBackspace={onBackspace}
        onInput={onInput}
        onLetter={onLetter}
        onSubmit={onSubmit}
      />
    </div>
  );
}

function LeaderboardPage({ leaderboard }: { leaderboard: LeaderboardEntry[] }) {
  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_320px]">
      <section>
        <SectionKicker>Classement</SectionKicker>
        <h2 className="mt-2 text-4xl font-black">Top du jour</h2>
        <div className="mt-6">
          <LeaderboardList large leaderboard={leaderboard} />
        </div>
      </section>
      <Panel className="h-fit">
        <SectionKicker>Score</SectionKicker>
        <div className="mt-4 space-y-3 text-sm leading-6 text-[#d7dadc]">
          <p>Le score diminue à chaque essai utilisé.</p>
          <p>Plus tu trouves vite, plus tu montes dans le classement.</p>
          <p>Le classement est remis à zéro chaque jour.</p>
        </div>
      </Panel>
    </div>
  );
}

export function App() {
  const auth = useAuth();
  const game = normalizeGame(useQuery<GameState>("game"));
  const leaderboardQuery = useQuery<LeaderboardEntry[]>("leaderboard");
  const leaderboard = Array.isArray(leaderboardQuery) ? leaderboardQuery : [];
  const submitGuess = useMutation<[guess: string], Attempt | null>(
    "submitGuess",
  );
  const [page, setPage] = useState<Page>("home");
  const [inputValue, setInputValue] = useState("");
  const [pendingGuess, setPendingGuess] = useState("");
  const [localError, setLocalError] = useState("");
  const visibleAttempts = pendingGuess
    ? [
        ...game.attempts,
        {
          id: "pending",
          guess: pendingGuess,
          pattern: [],
          attemptNumber: game.attempts.length + 1,
          solved: false,
          score: 0,
          createdAt: "",
        },
      ]
    : game.attempts;
  const rows = Array.from(
    { length: game.maxAttempts },
    (_, index) => visibleAttempts[index],
  );
  const activeRow = Math.min(visibleAttempts.length, game.maxAttempts - 1);
  const states = letterStates(game.attempts);
  const solvedAttempt = game.attempts.find((attempt) => attempt.solved);
  const progress = Math.round((game.attempts.length / game.maxAttempts) * 100);
  const canSubmit =
    inputValue.length === WORD_LENGTH && !game.over && !pendingGuess;
  const bestScore = leaderboard[0]?.score ?? 0;

  async function onSubmit(event?: SubmitEvent) {
    event?.preventDefault();
    const guess = normalizeGuess(inputValue);

    if (guess.length !== WORD_LENGTH || game.over || pendingGuess) {
      return;
    }

    setLocalError("");
    setPendingGuess(guess);
    setInputValue("");

    try {
      const result = await submitGuess(guess);
      if (!result) {
        setLocalError("Impossible d'envoyer cette proposition.");
        setInputValue(guess);
      }
    } finally {
      setPendingGuess("");
    }
  }

  return (
    <Shell>
      <Surface>
        <Header
          auth={auth}
          dateKey={game.dateKey}
          page={page}
          setPage={setPage}
        />

        {page === "home" ? (
          <HomePage
            bestScore={bestScore}
            game={game}
            leaderboardCount={leaderboard.length}
            onGoLeaderboard={() => setPage("leaderboard")}
            onGoPlay={() => setPage("play")}
          />
        ) : page === "play" ? (
          <PlayPage
            activeRow={activeRow}
            canSubmit={canSubmit}
            game={game}
            inputValue={inputValue}
            localError={localError}
            pendingGuess={pendingGuess}
            progress={progress}
            rows={rows}
            solvedAttempt={solvedAttempt}
            states={states}
            onBackspace={() => {
              setLocalError("");
              setInputValue((value) => value.slice(0, -1));
            }}
            onInput={(value) => {
              setLocalError("");
              setInputValue(normalizeGuess(value));
            }}
            onLetter={(letter) => {
              setLocalError("");
              setInputValue((value) => normalizeGuess(`${value}${letter}`));
            }}
            onSubmit={onSubmit}
          />
        ) : (
          <LeaderboardPage leaderboard={leaderboard} />
        )}
      </Surface>
    </Shell>
  );
}
