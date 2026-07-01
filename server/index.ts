import {
  boolean,
  capsule,
  endpoint,
  mutation,
  query,
  string,
  table,
  text,
} from "lakebed/server";
import {
  getPattern,
  getScore,
  getWordForDate,
  MAX_ATTEMPTS,
  normalizeGuess,
  WORD_LENGTH,
  type Attempt,
  type GameState,
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

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
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
          score: Number(row.score),
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
  },

  mutations: {
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
        userName: ctx.auth.displayName,
        dateKey,
        guess,
        pattern: JSON.stringify(pattern),
        attemptNumber: String(attemptNumber),
        solved,
        score: solved ? String(getScore(attemptNumber)) : "0",
      });

      return toAttempt(inserted as StoredAttempt);
    }),
  },

  endpoints: {
    favicon: endpoint({ method: "GET", path: "/favicon.ico" }, () =>
      text("", { status: 204 }),
    ),
  },
});
