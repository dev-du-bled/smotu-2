import { and, asc, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import {
  MAX_ATTEMPTS,
  WORDS,
  WORD_LENGTH,
  getPattern,
  getScoreForMode,
  getWordForDate,
  normalizeGuess,
  type Attempt,
  type EndlessGameState,
  type EndlessGameStatus,
  type GameMode,
  type GameState,
  type GlobalLeaderboardEntry,
  type TileState,
} from "../shared/game";
import {
  attempts as attemptsTable,
  endlessAttempts as endlessAttemptsTable,
  endlessGames as endlessGamesTable,
  type StoredAttempt,
  type StoredEndlessAttempt,
  type StoredEndlessGame,
} from "./db/schema";

type Env = {
  ASSETS: Fetcher;
  DB: D1Database;
  SHOO_BASE_URL?: string;
};

type AuthUser = {
  email?: string;
  name: string;
  picture?: string;
  userId: string;
};

function database(env: Env) {
  return drizzle(env.DB);
}

type Db = ReturnType<typeof database>;

const schemaStatements = [
  "CREATE TABLE IF NOT EXISTS attempts (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, user_name TEXT NOT NULL, date_key TEXT NOT NULL, guess TEXT NOT NULL, pattern TEXT NOT NULL, attempt_number INTEGER NOT NULL, solved INTEGER NOT NULL DEFAULT 0, score INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
  "CREATE INDEX IF NOT EXISTS attempts_user_date_idx ON attempts (user_id, date_key, created_at)",
  "CREATE INDEX IF NOT EXISTS attempts_date_solved_idx ON attempts (date_key, solved, created_at)",
  "CREATE TABLE IF NOT EXISTS endless_games (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, user_name TEXT NOT NULL, answer TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', score INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
  "CREATE INDEX IF NOT EXISTS endless_games_user_status_idx ON endless_games (user_id, status, created_at)",
  "CREATE TABLE IF NOT EXISTS endless_attempts (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, user_name TEXT NOT NULL, game_id TEXT NOT NULL, guess TEXT NOT NULL, pattern TEXT NOT NULL, attempt_number INTEGER NOT NULL, solved INTEGER NOT NULL DEFAULT 0, score INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
  "CREATE INDEX IF NOT EXISTS endless_attempts_game_idx ON endless_attempts (game_id, created_at)",
  "CREATE INDEX IF NOT EXISTS endless_attempts_solved_idx ON endless_attempts (solved, created_at)",
];

let schemaReady: Promise<void> | undefined;
let jwksCache: ReturnType<typeof createRemoteJWKSet> | undefined;

function now(): string {
  return new Date().toISOString();
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function json(value: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(value), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...init?.headers,
    },
  });
}

function error(message: string, status = 400): Response {
  return json({ error: message }, { status });
}

async function ensureSchema(db: Db): Promise<void> {
  schemaReady ??= (async () => {
    for (const statement of schemaStatements) {
      await db.run(sql.raw(statement));
    }
  })();
  await schemaReady;
}

function shooBaseUrl(env: Env): string {
  return env.SHOO_BASE_URL || "https://shoo.dev";
}

function jwks(env: Env) {
  jwksCache ??= createRemoteJWKSet(
    new URL("/.well-known/jwks.json", shooBaseUrl(env)),
  );
  return jwksCache;
}

function bearerToken(request: Request): string {
  const header = request.headers.get("Authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? "";
}

function nameFromClaims(payload: JWTPayload, userId: string): string {
  const name = typeof payload.name === "string" ? payload.name : "";
  const email = typeof payload.email === "string" ? payload.email : "";
  return name.trim() || email.trim() || `Joueur ${userId.slice(-6)}`;
}

async function verifyUser(request: Request, env: Env): Promise<AuthUser> {
  const idToken = bearerToken(request);

  if (!idToken) {
    throw new Response(JSON.stringify({ error: "Missing bearer token" }), {
      status: 401,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  const origin = new URL(request.url).origin;
  const { payload } = await jwtVerify(idToken, jwks(env), {
    issuer: shooBaseUrl(env),
    audience: `origin:${origin}`,
  });

  if (typeof payload.pairwise_sub !== "string") {
    throw new Response(JSON.stringify({ error: "Invalid Shoo token" }), {
      status: 401,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  return {
    userId: payload.pairwise_sub,
    name: nameFromClaims(payload, payload.pairwise_sub),
    email: typeof payload.email === "string" ? payload.email : undefined,
    picture: typeof payload.picture === "string" ? payload.picture : undefined,
  };
}

async function requireUser(request: Request, env: Env): Promise<AuthUser> {
  try {
    return await verifyUser(request, env);
  } catch (reason) {
    if (reason instanceof Response) {
      throw reason;
    }
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
}

function randomWord(): string {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function scoreFor(mode: GameMode, attemptNumber: number): number {
  return getScoreForMode(mode, attemptNumber);
}

function toAttempt(row: StoredAttempt | StoredEndlessAttempt): Attempt {
  return {
    id: row.id,
    guess: row.guess,
    pattern: JSON.parse(row.pattern) as TileState[],
    attemptNumber: row.attemptNumber,
    solved: Boolean(row.solved),
    score: row.score,
    createdAt: row.createdAt,
  };
}

async function dailyAttempts(
  db: Db,
  userId: string,
  dateKey: string,
): Promise<StoredAttempt[]> {
  return await db
    .select()
    .from(attemptsTable)
    .where(and(eq(attemptsTable.userId, userId), eq(attemptsTable.dateKey, dateKey)))
    .orderBy(asc(attemptsTable.createdAt))
    .all();
}

async function endlessAttempts(
  db: Db,
  gameId: string,
): Promise<StoredEndlessAttempt[]> {
  return await db
    .select()
    .from(endlessAttemptsTable)
    .where(eq(endlessAttemptsTable.gameId, gameId))
    .orderBy(asc(endlessAttemptsTable.createdAt))
    .all();
}

async function activeEndlessGame(
  db: Db,
  userId: string,
): Promise<StoredEndlessGame | null> {
  return (
    (await db
      .select()
      .from(endlessGamesTable)
      .where(
        and(
          eq(endlessGamesTable.userId, userId),
          eq(endlessGamesTable.status, "active"),
        ),
      )
      .orderBy(desc(endlessGamesTable.createdAt))
      .limit(1)
      .get()) ?? null
  );
}

async function latestEndlessGame(
  db: Db,
  userId: string,
): Promise<StoredEndlessGame | null> {
  return (
    (await db
      .select()
      .from(endlessGamesTable)
      .where(eq(endlessGamesTable.userId, userId))
      .orderBy(desc(endlessGamesTable.createdAt))
      .limit(1)
      .get()) ?? null
  );
}

async function gamesPlayed(db: Db, userId: string): Promise<number> {
  const row = await db
    .select({ count: sql<number>`count(*)` })
    .from(endlessGamesTable)
    .where(eq(endlessGamesTable.userId, userId))
    .get();

  return Number(row?.count ?? 0);
}

async function getDailyGame(db: Db, user: AuthUser): Promise<GameState> {
  const dateKey = todayKey();
  const rows = await dailyAttempts(db, user.userId, dateKey);
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
}

function idleEndlessState(games: number): EndlessGameState {
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
    gamesPlayed: games,
  };
}

function toEndlessGameState(
  game: StoredEndlessGame | null,
  attempts: StoredEndlessAttempt[],
  played: number,
): EndlessGameState {
  if (!game) {
    return idleEndlessState(played);
  }

  const mappedAttempts = attempts.map(toAttempt);
  const solved =
    game.status === "solved" || mappedAttempts.some((attempt) => attempt.solved);
  const failed =
    game.status === "failed" ||
    (!solved && mappedAttempts.length >= MAX_ATTEMPTS);
  const status: EndlessGameStatus = solved ? "solved" : failed ? "failed" : "active";

  return {
    gameId: game.id,
    dateKey: `Libre #${played}`,
    attempts: mappedAttempts,
    maxAttempts: MAX_ATTEMPTS,
    wordLength: WORD_LENGTH,
    solved,
    over: status !== "active",
    answer: status === "active" ? "" : game.answer,
    status,
    gamesPlayed: played,
  };
}

async function getEndlessGame(
  db: Db,
  user: AuthUser,
): Promise<EndlessGameState> {
  const active = await activeEndlessGame(db, user.userId);
  const latest = active ?? (await latestEndlessGame(db, user.userId));
  const played = await gamesPlayed(db, user.userId);
  const attempts = latest ? await endlessAttempts(db, latest.id) : [];

  return toEndlessGameState(latest, attempts, played);
}

async function submitDailyGuess(
  db: Db,
  user: AuthUser,
  rawGuess: string,
): Promise<GameState> {
  const guess = normalizeGuess(rawGuess);
  const dateKey = todayKey();

  if (guess.length !== WORD_LENGTH) {
    throw new Error("Le mot doit faire cinq lettres.");
  }

  const previous = await dailyAttempts(db, user.userId, dateKey);
  if (
    previous.length >= MAX_ATTEMPTS ||
    previous.some((attempt) => Boolean(attempt.solved))
  ) {
    return getDailyGame(db, user);
  }

  const answer = getWordForDate(dateKey);
  const attemptNumber = previous.length + 1;
  const solved = guess === answer;
  const timestamp = now();

  await db
    .insert(attemptsTable)
    .values({
      id: crypto.randomUUID(),
      userId: user.userId,
      userName: user.name,
      dateKey,
      guess,
      pattern: JSON.stringify(getPattern(guess, answer)),
      attemptNumber,
      solved: solved ? 1 : 0,
      score: solved ? scoreFor("daily", attemptNumber) : 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .run();

  return getDailyGame(db, user);
}

async function startEndlessGame(
  db: Db,
  user: AuthUser,
): Promise<EndlessGameState> {
  const active = await activeEndlessGame(db, user.userId);
  const played = await gamesPlayed(db, user.userId);

  if (active) {
    return toEndlessGameState(active, await endlessAttempts(db, active.id), played);
  }

  const gameId = crypto.randomUUID();
  const timestamp = now();

  await db
    .insert(endlessGamesTable)
    .values({
      id: gameId,
      userId: user.userId,
      userName: user.name,
      answer: randomWord(),
      status: "active",
      score: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .run();

  const game = await latestEndlessGame(db, user.userId);
  return toEndlessGameState(game, [], played + 1);
}

async function submitEndlessGuess(
  db: Db,
  user: AuthUser,
  rawGuess: string,
): Promise<EndlessGameState> {
  const game = await activeEndlessGame(db, user.userId);
  const guess = normalizeGuess(rawGuess);

  if (!game) {
    throw new Error("Lance une manche libre avant de jouer.");
  }
  if (guess.length !== WORD_LENGTH) {
    throw new Error("Le mot doit faire cinq lettres.");
  }

  const previous = await endlessAttempts(db, game.id);
  if (
    previous.length >= MAX_ATTEMPTS ||
    previous.some((attempt) => Boolean(attempt.solved))
  ) {
    return getEndlessGame(db, user);
  }

  const attemptNumber = previous.length + 1;
  const solved = guess === game.answer;
  const score = solved ? scoreFor("endless", attemptNumber) : 0;
  const timestamp = now();

  await db
    .insert(endlessAttemptsTable)
    .values({
      id: crypto.randomUUID(),
      userId: user.userId,
      userName: user.name,
      gameId: game.id,
      guess,
      pattern: JSON.stringify(getPattern(guess, game.answer)),
      attemptNumber,
      solved: solved ? 1 : 0,
      score,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .run();

  if (solved) {
    await db
      .update(endlessGamesTable)
      .set({ score, status: "solved", updatedAt: timestamp })
      .where(eq(endlessGamesTable.id, game.id))
      .run();
  } else if (attemptNumber >= MAX_ATTEMPTS) {
    await db
      .update(endlessGamesTable)
      .set({ score: 0, status: "failed", updatedAt: timestamp })
      .where(eq(endlessGamesTable.id, game.id))
      .run();
  }

  return getEndlessGame(db, user);
}

function addScore(
  entries: Record<string, GlobalLeaderboardEntry>,
  event: {
    mode: GameMode;
    score: number;
    userId: string;
    userName: string;
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

async function globalLeaderboard(db: Db): Promise<GlobalLeaderboardEntry[]> {
  const daily = await db
    .select({
      userId: attemptsTable.userId,
      userName: attemptsTable.userName,
      attemptNumber: attemptsTable.attemptNumber,
      createdAt: attemptsTable.createdAt,
    })
    .from(attemptsTable)
    .where(eq(attemptsTable.solved, 1))
    .orderBy(asc(attemptsTable.createdAt))
    .all();

  const endless = await db
    .select({
      userId: endlessAttemptsTable.userId,
      userName: endlessAttemptsTable.userName,
      attemptNumber: endlessAttemptsTable.attemptNumber,
      score: endlessAttemptsTable.score,
      createdAt: endlessAttemptsTable.createdAt,
    })
    .from(endlessAttemptsTable)
    .where(eq(endlessAttemptsTable.solved, 1))
    .orderBy(asc(endlessAttemptsTable.createdAt))
    .all();

  const entries: Record<string, GlobalLeaderboardEntry> = {};

  for (const row of daily) {
    addScore(entries, {
      userId: row.userId,
      userName: row.userName,
      mode: "daily",
      score: scoreFor("daily", row.attemptNumber),
      createdAt: row.createdAt,
    });
  }

  for (const row of endless) {
    addScore(entries, {
      userId: row.userId,
      userName: row.userName,
      mode: "endless",
      score: row.score || scoreFor("endless", row.attemptNumber),
      createdAt: row.createdAt,
    });
  }

  return Object.values(entries)
    .sort((left, right) => {
      if (right.totalScore !== left.totalScore) {
        return right.totalScore - left.totalScore;
      }
      return left.lastScoredAt < right.lastScoredAt ? -1 : 1;
    })
    .slice(0, 30);
}

async function requestBody(request: Request): Promise<Record<string, unknown>> {
  if (!request.body) {
    return {};
  }
  const value = await request.json().catch(() => ({}));
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const db = database(env);
  await ensureSchema(db);

  const url = new URL(request.url);
  const user = await requireUser(request, env);

  if (request.method === "GET" && url.pathname === "/api/session") {
    return json({ user });
  }

  if (request.method === "GET" && url.pathname === "/api/game/daily") {
    return json(await getDailyGame(db, user));
  }

  if (request.method === "POST" && url.pathname === "/api/game/daily/guess") {
    const body = await requestBody(request);
    return json(await submitDailyGuess(db, user, String(body.guess ?? "")));
  }

  if (request.method === "GET" && url.pathname === "/api/game/endless") {
    return json(await getEndlessGame(db, user));
  }

  if (request.method === "POST" && url.pathname === "/api/game/endless/start") {
    return json(await startEndlessGame(db, user));
  }

  if (request.method === "POST" && url.pathname === "/api/game/endless/guess") {
    const body = await requestBody(request);
    return json(await submitEndlessGuess(db, user, String(body.guess ?? "")));
  }

  if (request.method === "GET" && url.pathname === "/api/leaderboard/global") {
    return json(await globalLeaderboard(db));
  }

  return error("Not found", 404);
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      try {
        return await handleApi(request, env);
      } catch (reason) {
        if (reason instanceof Response) {
          return reason;
        }
        const message = reason instanceof Error ? reason.message : "Server error";
        return error(message, 500);
      }
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
