import {
  boolean,
  capsule,
  endpoint,
  mutation,
  query,
  string,
  table,
  text,
  type ServerContext,
} from "lakebed/server";
import {
  WORDS,
  getScoreForMode,
  getPattern,
  getScore,
  getWordForDate,
  MAX_ATTEMPTS,
  normalizeGuess,
  WORD_LENGTH,
  type Attempt,
  type EndlessGameState,
  type EndlessGameStatus,
  type GameState,
  type GameMode,
  type GlobalLeaderboardEntry,
  type LeaderboardEntry,
  type TileState,
} from "../shared/game";

type StoredAttempt = {
  id: string;
  userId: string;
  userName: string;
  dateKey: string;
  guess: string;
  pattern: string;
  attemptNumber: string;
  solved: boolean;
  score: string;
  createdAt: string;
  updatedAt: string;
};

type StoredEndlessGame = {
  id: string;
  userId: string;
  userName: string;
  answer: string;
  status: EndlessGameStatus;
  score: string;
  createdAt: string;
  updatedAt: string;
};

type StoredEndlessAttempt = {
  id: string;
  userId: string;
  userName: string;
  gameId: string;
  guess: string;
  pattern: string;
  attemptNumber: string;
  solved: boolean;
  score: string;
  createdAt: string;
  updatedAt: string;
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function displayName(name: string): string {
  return name.trim() || "Joueur";
}

function randomWord(): string {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function toAttempt(row: StoredAttempt): Attempt {
  return {
    id: row.id,
    guess: row.guess,
    pattern: JSON.parse(row.pattern) as TileState[],
    attemptNumber: Number(row.attemptNumber),
    solved: row.solved,
    score: Number(row.score),
    createdAt: row.createdAt,
  };
}

function toEndlessAttempt(row: StoredEndlessAttempt): Attempt {
  return {
    id: row.id,
    guess: row.guess,
    pattern: JSON.parse(row.pattern) as TileState[],
    attemptNumber: Number(row.attemptNumber),
    solved: row.solved,
    score: Number(row.score),
    createdAt: row.createdAt,
  };
}

function getEndlessAttempts(
  ctx: ServerContext,
  gameId: string,
): StoredEndlessAttempt[] {
  return ctx.db.endlessAttempts
    .where("gameId", gameId)
    .orderBy("createdAt", "asc")
    .all() as StoredEndlessAttempt[];
}

function findActiveEndlessGame(
  ctx: ServerContext,
): StoredEndlessGame | undefined {
  return (
    ctx.db.endlessGames
      .where("userId", ctx.auth.userId)
      .where("status", "active")
      .orderBy("createdAt", "desc")
      .limit(1)
      .all() as StoredEndlessGame[]
  )[0];
}

function toEndlessGameState(
  game: StoredEndlessGame | undefined,
  attempts: StoredEndlessAttempt[],
  gamesPlayed: number,
): EndlessGameState {
  if (!game) {
    return {
      gameId: "",
      dateKey: "",
      attempts: [],
      maxAttempts: MAX_ATTEMPTS,
      wordLength: WORD_LENGTH,
      solved: false,
      over: true,
      answer: "",
      status: "idle",
      gamesPlayed,
    };
  }

  const mappedAttempts = attempts.map(toEndlessAttempt);
  const solved = game.status === "solved" || mappedAttempts.some((attempt) => attempt.solved);
  const failed =
    game.status === "failed" || (!solved && mappedAttempts.length >= MAX_ATTEMPTS);
  const status: EndlessGameStatus = solved ? "solved" : failed ? "failed" : "active";
  const over = status !== "active";

  return {
    gameId: game.id,
    dateKey: `Libre #${gamesPlayed}`,
    attempts: mappedAttempts,
    maxAttempts: MAX_ATTEMPTS,
    wordLength: WORD_LENGTH,
    solved,
    over,
    answer: over ? game.answer : "",
    status,
    gamesPlayed,
  };
}

function scoreFor(mode: GameMode, attemptNumber: number): number {
  return getScoreForMode(mode, attemptNumber);
}

function addScore(
  entries: Record<string, GlobalLeaderboardEntry>,
  event: {
    userId: string;
    userName: string;
    mode: GameMode;
    score: number;
    createdAt: string;
  },
) {
  const current =
    entries[event.userId] ??
    ({
      userId: event.userId,
      userName: event.userName,
      totalScore: 0,
      dailyScore: 0,
      endlessScore: 0,
      gamesSolved: 0,
      lastScoredAt: event.createdAt,
    } satisfies GlobalLeaderboardEntry);

  current.userName = event.userName;
  current.totalScore += event.score;
  current.gamesSolved += 1;
  current.lastScoredAt =
    current.lastScoredAt > event.createdAt ? current.lastScoredAt : event.createdAt;

  if (event.mode === "daily") {
    current.dailyScore += event.score;
  } else {
    current.endlessScore += event.score;
  }

  entries[event.userId] = current;
}

export default capsule({
  schema: {
    attempts: table({
      userId: string(),
      userName: string(),
      dateKey: string(),
      guess: string(),
      pattern: string(),
      attemptNumber: string(),
      solved: boolean().default(false),
      score: string(),
    }),
    endlessGames: table({
      userId: string(),
      userName: string(),
      answer: string(),
      status: string().default("active"),
      score: string(),
    }),
    endlessAttempts: table({
      userId: string(),
      userName: string(),
      gameId: string(),
      guess: string(),
      pattern: string(),
      attemptNumber: string(),
      solved: boolean().default(false),
      score: string(),
    }),
  },

  queries: {
    game: query((ctx): GameState => {
      const dateKey = todayKey();
      const rows = ctx.db.attempts
        .where("userId", ctx.auth.userId)
        .where("dateKey", dateKey)
        .orderBy("createdAt", "asc")
        .all() as StoredAttempt[];
      const attempts = rows.map(toAttempt);
      const solved = attempts.some((attempt) => attempt.solved);
      const over = solved || attempts.length >= MAX_ATTEMPTS;

      return {
        dateKey,
        attempts,
        maxAttempts: MAX_ATTEMPTS,
        wordLength: WORD_LENGTH,
        solved,
        over,
        answer: over ? getWordForDate(dateKey) : "",
      };
    }),

    leaderboard: query((ctx): LeaderboardEntry[] => {
      const dateKey = todayKey();
      const rows = ctx.db.attempts
        .where("dateKey", dateKey)
        .where("solved", true)
        .orderBy("createdAt", "asc")
        .all() as StoredAttempt[];
      const bestByUser: Record<string, LeaderboardEntry> = {};

      for (const row of rows) {
        const current = bestByUser[row.userId];
        const candidate = {
          userId: row.userId,
          userName: row.userName,
          score: scoreFor("daily", Number(row.attemptNumber)),
          attempts: Number(row.attemptNumber),
          createdAt: row.createdAt,
        };

        if (
          !current ||
          candidate.score > current.score ||
          (candidate.score === current.score &&
            candidate.createdAt < current.createdAt)
        ) {
          bestByUser[row.userId] = candidate;
        }
      }

      return Object.keys(bestByUser)
        .map((userId) => bestByUser[userId])
        .sort((left, right) => {
          if (right.score !== left.score) {
            return right.score - left.score;
          }
          return left.createdAt < right.createdAt ? -1 : 1;
        })
        .slice(0, 20);
    }),

    globalLeaderboard: query((ctx): GlobalLeaderboardEntry[] => {
      const entries: Record<string, GlobalLeaderboardEntry> = {};
      const dailyRows = ctx.db.attempts
        .where("solved", true)
        .orderBy("createdAt", "asc")
        .all() as StoredAttempt[];
      const endlessRows = ctx.db.endlessAttempts
        .where("solved", true)
        .orderBy("createdAt", "asc")
        .all() as StoredEndlessAttempt[];

      for (const row of dailyRows) {
        addScore(entries, {
          userId: row.userId,
          userName: row.userName,
          mode: "daily",
          score: scoreFor("daily", Number(row.attemptNumber)),
          createdAt: row.createdAt,
        });
      }

      for (const row of endlessRows) {
        addScore(entries, {
          userId: row.userId,
          userName: row.userName,
          mode: "endless",
          score: Number(row.score) || scoreFor("endless", Number(row.attemptNumber)),
          createdAt: row.createdAt,
        });
      }

      return Object.keys(entries)
        .map((userId) => entries[userId])
        .sort((left, right) => {
          if (right.totalScore !== left.totalScore) {
            return right.totalScore - left.totalScore;
          }
          return left.lastScoredAt < right.lastScoredAt ? -1 : 1;
        })
        .slice(0, 30);
    }),

    endlessGame: query((ctx): EndlessGameState => {
      const activeGame = findActiveEndlessGame(ctx);
      const latestGame =
        activeGame ??
        (
          ctx.db.endlessGames
            .where("userId", ctx.auth.userId)
            .orderBy("createdAt", "desc")
            .limit(1)
            .all() as StoredEndlessGame[]
        )[0];
      const gamesPlayed = (
        ctx.db.endlessGames.where("userId", ctx.auth.userId).all() as StoredEndlessGame[]
      ).length;
      const attempts = latestGame ? getEndlessAttempts(ctx, latestGame.id) : [];

      return toEndlessGameState(latestGame, attempts, gamesPlayed);
    }),
  },

  mutations: {
    startEndlessGame: mutation((ctx): EndlessGameState => {
      const activeGame = findActiveEndlessGame(ctx);
      const games = ctx.db.endlessGames
        .where("userId", ctx.auth.userId)
        .all() as StoredEndlessGame[];

      if (activeGame) {
        return toEndlessGameState(
          activeGame,
          getEndlessAttempts(ctx, activeGame.id),
          games.length,
        );
      }

      const game = ctx.db.endlessGames.insert({
        userId: ctx.auth.userId,
        userName: displayName(ctx.auth.displayName),
        answer: randomWord(),
        status: "active",
        score: "0",
      }) as StoredEndlessGame;

      return toEndlessGameState(game, [], games.length + 1);
    }),

    submitGuess: mutation((ctx, rawGuess: string): Attempt | null => {
      const dateKey = todayKey();
      const guess = normalizeGuess(rawGuess);

      if (guess.length !== WORD_LENGTH) {
        return null;
      }

      const previous = ctx.db.attempts
        .where("userId", ctx.auth.userId)
        .where("dateKey", dateKey)
        .orderBy("createdAt", "asc")
        .all() as StoredAttempt[];

      if (
        previous.length >= MAX_ATTEMPTS ||
        previous.some((attempt) => attempt.solved)
      ) {
        return null;
      }

      const answer = getWordForDate(dateKey);
      const attemptNumber = previous.length + 1;
      const solved = guess === answer;
      const pattern = getPattern(guess, answer);

      const inserted = ctx.db.attempts.insert({
        userId: ctx.auth.userId,
        userName: displayName(ctx.auth.displayName),
        dateKey,
        guess,
        pattern: JSON.stringify(pattern),
        attemptNumber: String(attemptNumber),
        solved,
        score: solved ? String(getScore(attemptNumber)) : "0",
      });

      return toAttempt(inserted as StoredAttempt);
    }),

    submitEndlessGuess: mutation((ctx, rawGuess: string): Attempt | null => {
      const activeGame = findActiveEndlessGame(ctx);
      const guess = normalizeGuess(rawGuess);

      if (!activeGame || guess.length !== WORD_LENGTH) {
        return null;
      }

      const previous = getEndlessAttempts(ctx, activeGame.id);

      if (
        previous.length >= MAX_ATTEMPTS ||
        previous.some((attempt) => attempt.solved)
      ) {
        return null;
      }

      const attemptNumber = previous.length + 1;
      const solved = guess === activeGame.answer;
      const score = solved ? scoreFor("endless", attemptNumber) : 0;
      const pattern = getPattern(guess, activeGame.answer);

      const inserted = ctx.db.endlessAttempts.insert({
        userId: ctx.auth.userId,
        userName: displayName(ctx.auth.displayName),
        gameId: activeGame.id,
        guess,
        pattern: JSON.stringify(pattern),
        attemptNumber: String(attemptNumber),
        solved,
        score: String(score),
      }) as StoredEndlessAttempt;

      if (solved) {
        ctx.db.endlessGames.update(activeGame.id, {
          status: "solved",
          score: String(score),
        });
      } else if (attemptNumber >= MAX_ATTEMPTS) {
        ctx.db.endlessGames.update(activeGame.id, {
          status: "failed",
          score: "0",
        });
      }

      return toEndlessAttempt(inserted);
    }),
  },

  endpoints: {
    favicon: endpoint({ method: "GET", path: "/favicon.ico" }, () =>
      text("", { status: 204 }),
    ),
  },
});
