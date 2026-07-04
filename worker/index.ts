import { and, asc, desc, eq, inArray, lt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import {
  MAX_ATTEMPTS,
  MASTERMIND_CODE_LENGTH,
  MASTERMIND_COLORS,
  MASTERMIND_MAX_ATTEMPTS,
  WORD_LENGTH,
  getMastermindFeedback,
  getEndlessLossPenalty,
  getPattern,
  getScoreForMode,
  getWordForDate,
  isKnownWord,
  normalizeMastermindGuess,
  normalizeGuess,
  normalizeWordLength,
  randomWord,
  type Attempt,
  type EndlessGameState,
  type EndlessGameStatus,
  type GameMode,
  type GameState,
  type GlobalLeaderboardEntry,
  type LeaderboardSet,
  type MastermindAttempt,
  type MastermindColorId,
  type MastermindGameState,
  type MastermindGameStatus,
  type ProfileStats,
  type TileState,
} from "../shared/game";
import {
  dailyGames as dailyGamesTable,
  endlessGames as endlessGamesTable,
  users as usersTable,
  mastermindGames as mastermindGamesTable,
  type StoredDailyGame,
  type StoredEndlessGame,
  type StoredMastermindGame,
} from "./db/schema";
import { authUser } from "./db/auth-schema";
import { createAuth, type Env } from "./auth";

type AuthUser = {
  authUserId: string;
  email?: string;
  googleAccountId?: string;
  name: string;
  picture?: string;
  role?: string | null;
  sessionId: string;
  sessionToken: string;
  userId: string;
};

function database(env: Env) {
  return drizzle(env.DB);
}

type Db = ReturnType<typeof database>;

const schemaStatements = [
  'CREATE TABLE IF NOT EXISTS "user" (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, emailVerified INTEGER NOT NULL DEFAULT 0, image TEXT, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL, role TEXT DEFAULT \'user\', banned INTEGER DEFAULT 0, banReason TEXT, banExpires INTEGER)',
  'CREATE TABLE IF NOT EXISTS "session" (id TEXT PRIMARY KEY, expiresAt INTEGER NOT NULL, token TEXT NOT NULL UNIQUE, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL, ipAddress TEXT, userAgent TEXT, userId TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE, impersonatedBy TEXT)',
  'CREATE TABLE IF NOT EXISTS "account" (id TEXT PRIMARY KEY, accountId TEXT NOT NULL, providerId TEXT NOT NULL, userId TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE, accessToken TEXT, refreshToken TEXT, idToken TEXT, accessTokenExpiresAt INTEGER, refreshTokenExpiresAt INTEGER, scope TEXT, password TEXT, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL)',
  'CREATE UNIQUE INDEX IF NOT EXISTS account_provider_account_idx ON "account" (providerId, accountId)',
  'CREATE TABLE IF NOT EXISTS "verification" (id TEXT PRIMARY KEY, identifier TEXT NOT NULL, value TEXT NOT NULL, expiresAt INTEGER NOT NULL, createdAt INTEGER, updatedAt INTEGER)',
  "CREATE TABLE IF NOT EXISTS users (user_id TEXT PRIMARY KEY, username TEXT NOT NULL, auth_user_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS daily_games (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, user_name TEXT NOT NULL, date_key TEXT NOT NULL, attempts TEXT NOT NULL DEFAULT '[]', solved INTEGER NOT NULL DEFAULT 0, score INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
  "CREATE UNIQUE INDEX IF NOT EXISTS daily_games_user_date_idx ON daily_games (user_id, date_key)",
  "CREATE INDEX IF NOT EXISTS daily_games_solved_idx ON daily_games (solved, created_at)",
  "CREATE TABLE IF NOT EXISTS endless_games (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, user_name TEXT NOT NULL, answer TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', score INTEGER NOT NULL DEFAULT 0, attempts TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
  "CREATE INDEX IF NOT EXISTS endless_games_user_status_idx ON endless_games (user_id, status, created_at)",
  "CREATE TABLE IF NOT EXISTS mastermind_games (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, user_name TEXT NOT NULL, answer TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', score INTEGER NOT NULL DEFAULT 0, attempts TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
  "CREATE INDEX IF NOT EXISTS mastermind_games_user_status_idx ON mastermind_games (user_id, status, created_at)",
];

const migrationStatements = [
  // Anciennes bases: on rajoute les colonnes manquantes avant le backfill JSON.
  "ALTER TABLE users ADD COLUMN auth_user_id TEXT",
  "ALTER TABLE endless_games ADD COLUMN attempts TEXT NOT NULL DEFAULT '[]'",
  "ALTER TABLE mastermind_games ADD COLUMN attempts TEXT NOT NULL DEFAULT '[]'",
  'ALTER TABLE "user" ADD COLUMN role TEXT DEFAULT \'user\'',
  'ALTER TABLE "user" ADD COLUMN banned INTEGER DEFAULT 0',
  'ALTER TABLE "user" ADD COLUMN banReason TEXT',
  'ALTER TABLE "user" ADD COLUMN banExpires INTEGER',
  'ALTER TABLE "session" ADD COLUMN impersonatedBy TEXT',
  // Colonnes de `users` jamais lues (email est déjà dans la table d'auth,
  // google_account_id est dérivable de `account`).
  "ALTER TABLE users DROP COLUMN google_account_id",
  "ALTER TABLE users DROP COLUMN email",
];

const postMigrationStatements = [
  "CREATE INDEX IF NOT EXISTS users_auth_user_idx ON users (auth_user_id)",
];

let schemaReady: Promise<void> | undefined;

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

    for (const statement of migrationStatements) {
      try {
        await db.run(sql.raw(statement));
      } catch (reason) {
        // D1 wraps duplicate-column errors and hides the SQLite detail in local
        // dev. These migrations only add nullable columns after the table exists.
        void reason;
      }
    }

    for (const statement of postMigrationStatements) {
      await db.run(sql.raw(statement));
    }

    await migrateAttemptsToGames(db);
  })();
  await schemaReady;
}

async function tableExists(db: Db, name: string): Promise<boolean> {
  const row = await db.get<{ name?: string }>(
    sql`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ${name}`,
  );
  return Boolean(row?.name);
}

// Backfill unique et idempotent: on replie les anciennes tables de coups
// (une ligne par coup) dans la colonne JSON `attempts` des parties, puis on les
// supprime. Gardé par l'existence des tables, donc no-op une fois terminé.
async function migrateAttemptsToGames(db: Db): Promise<void> {
  if (await tableExists(db, "endless_attempts")) {
    const rows = await db.all<{
      id: string;
      game_id: string;
      guess: string;
      pattern: string;
      attempt_number: number;
      solved: number;
      score: number;
      created_at: string;
    }>(
      sql.raw(
        "SELECT id, game_id, guess, pattern, attempt_number, solved, score, created_at FROM endless_attempts ORDER BY created_at, attempt_number",
      ),
    );
    const byGame = new Map<string, Attempt[]>();
    for (const row of rows) {
      const list = byGame.get(row.game_id) ?? [];
      list.push({
        id: row.id,
        guess: row.guess,
        pattern: JSON.parse(row.pattern) as TileState[],
        attemptNumber: row.attempt_number,
        solved: Boolean(row.solved),
        score: row.score,
        createdAt: row.created_at,
      });
      byGame.set(row.game_id, list);
    }
    for (const [gameId, list] of byGame) {
      await db
        .update(endlessGamesTable)
        .set({ attempts: JSON.stringify(list) })
        .where(eq(endlessGamesTable.id, gameId))
        .run();
    }
    await db.run(sql.raw("DROP TABLE IF EXISTS endless_attempts"));
  }

  if (await tableExists(db, "mastermind_attempts")) {
    const rows = await db.all<{
      id: string;
      game_id: string;
      guess: string;
      exact_count: number;
      present_count: number;
      attempt_number: number;
      solved: number;
      score: number;
      created_at: string;
    }>(
      sql.raw(
        "SELECT id, game_id, guess, exact_count, present_count, attempt_number, solved, score, created_at FROM mastermind_attempts ORDER BY created_at, attempt_number",
      ),
    );
    const byGame = new Map<string, MastermindAttempt[]>();
    for (const row of rows) {
      const list = byGame.get(row.game_id) ?? [];
      list.push({
        id: row.id,
        guess: normalizeMastermindGuess(row.guess),
        exact: row.exact_count,
        present: row.present_count,
        attemptNumber: row.attempt_number,
        solved: Boolean(row.solved),
        score: row.score,
        createdAt: row.created_at,
      });
      byGame.set(row.game_id, list);
    }
    for (const [gameId, list] of byGame) {
      await db
        .update(mastermindGamesTable)
        .set({ attempts: JSON.stringify(list) })
        .where(eq(mastermindGamesTable.id, gameId))
        .run();
    }
    await db.run(sql.raw("DROP TABLE IF EXISTS mastermind_attempts"));
  }

  if (await tableExists(db, "attempts")) {
    const rows = await db.all<{
      id: string;
      user_id: string;
      user_name: string;
      date_key: string;
      guess: string;
      pattern: string;
      attempt_number: number;
      solved: number;
      score: number;
      created_at: string;
    }>(
      sql.raw(
        "SELECT id, user_id, user_name, date_key, guess, pattern, attempt_number, solved, score, created_at FROM attempts ORDER BY created_at, attempt_number",
      ),
    );
    type DailyBucket = {
      userId: string;
      userName: string;
      dateKey: string;
      attempts: Attempt[];
      solved: number;
      score: number;
      createdAt: string;
    };
    const byDay = new Map<string, DailyBucket>();
    for (const row of rows) {
      const key = `${row.user_id} ${row.date_key}`;
      const bucket =
        byDay.get(key) ??
        ({
          userId: row.user_id,
          userName: row.user_name,
          dateKey: row.date_key,
          attempts: [],
          solved: 0,
          score: 0,
          createdAt: row.created_at,
        } satisfies DailyBucket);
      bucket.userName = row.user_name;
      bucket.attempts.push({
        id: row.id,
        guess: row.guess,
        pattern: JSON.parse(row.pattern) as TileState[],
        attemptNumber: row.attempt_number,
        solved: Boolean(row.solved),
        score: row.score,
        createdAt: row.created_at,
      });
      if (row.solved) {
        bucket.solved = 1;
        bucket.score = row.score;
      }
      byDay.set(key, bucket);
    }
    for (const bucket of byDay.values()) {
      await db
        .insert(dailyGamesTable)
        .values({
          id: crypto.randomUUID(),
          userId: bucket.userId,
          userName: bucket.userName,
          dateKey: bucket.dateKey,
          attempts: JSON.stringify(bucket.attempts),
          solved: bucket.solved,
          score: bucket.score,
          createdAt: bucket.createdAt,
          updatedAt: now(),
        })
        .onConflictDoNothing()
        .run();
    }
    await db.run(sql.raw("DROP TABLE IF EXISTS attempts"));
  }
}

async function googleAccountId(env: Env, authUserId: string): Promise<string | undefined> {
  const row = await env.DB.prepare(
    'SELECT "accountId" AS accountId FROM account WHERE "userId" = ? AND "providerId" = ? LIMIT 1',
  )
    .bind(authUserId, "google")
    .first<{ accountId?: string }>();

  return row?.accountId;
}

function fallbackName(name: string, email: string | undefined, userId: string): string {
  return name.trim() || email?.trim() || `Joueur ${userId.slice(-6)}`;
}

async function requireUser(request: Request, env: Env): Promise<AuthUser> {
  const auth = createAuth(env, request);
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  const accountId = await googleAccountId(env, session.user.id);
  const userId = accountId ? `google:${accountId}` : `auth:${session.user.id}`;

  return {
    authUserId: session.user.id,
    googleAccountId: accountId,
    userId,
    name: fallbackName(session.user.name, session.user.email, userId),
    email: session.user.email,
    picture: session.user.image ?? undefined,
    role: "role" in session.user ? String(session.user.role ?? "") : undefined,
    sessionId: session.session.id,
    sessionToken: session.session.token,
  };
}

function configuredAdminUserIds(env: Env): Set<string> {
  return new Set(
    (env.ADMIN_USER_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );
}

async function requireAdmin(
  request: Request,
  env: Env,
  db: Db,
): Promise<AuthUser> {
  const user = await requireUser(request, env);
  const configuredAdmins = configuredAdminUserIds(env);
  const row = await db
    .select({ role: authUser.role })
    .from(authUser)
    .where(eq(authUser.id, user.authUserId))
    .get();
  const role = row?.role ?? user.role ?? "user";

  if (role !== "admin" && !configuredAdmins.has(user.authUserId)) {
    throw new Response(JSON.stringify({ error: "Admin requis." }), {
      status: 403,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  return { ...user, role };
}

// Remplace le nom Google par le username choisi (public partout), et crée le
// profil Smotu stable rattaché au compte Google.
async function ensureUserProfile(db: Db, user: AuthUser): Promise<void> {
  const timestamp = now();
  const row = await db
    .select({ username: usersTable.username })
    .from(usersTable)
    .where(eq(usersTable.userId, user.userId))
    .get();

  if (row?.username) {
    await db
      .update(usersTable)
      .set({ authUserId: user.authUserId, updatedAt: timestamp })
      .where(eq(usersTable.userId, user.userId))
      .run();
    user.name = row.username;
    return;
  }

  await db
    .insert(usersTable)
    .values({
      userId: user.userId,
      username: user.name,
      authUserId: user.authUserId,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .onConflictDoUpdate({
      target: usersTable.userId,
      set: { authUserId: user.authUserId, updatedAt: timestamp },
    })
    .run();
}

function cleanUsername(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, 20);
}

async function setUsername(
  db: Db,
  user: AuthUser,
  raw: string,
): Promise<{ username: string }> {
  const username = cleanUsername(raw);
  if (username.length < 2) {
    throw new Error("Le pseudo doit faire au moins deux caractères.");
  }

  const timestamp = now();
  await db
    .insert(usersTable)
    .values({
      userId: user.userId,
      username,
      authUserId: user.authUserId,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .onConflictDoUpdate({
      target: usersTable.userId,
      set: { username, authUserId: user.authUserId, updatedAt: timestamp },
    })
    .run();

  // Le nom est dénormalisé dans les parties: on met à jour l'historique pour que
  // le nom Google disparaisse aussi du classement.
  await db.update(dailyGamesTable).set({ userName: username }).where(eq(dailyGamesTable.userId, user.userId)).run();
  await db.update(endlessGamesTable).set({ userName: username }).where(eq(endlessGamesTable.userId, user.userId)).run();
  await db.update(mastermindGamesTable).set({ userName: username }).where(eq(mastermindGamesTable.userId, user.userId)).run();

  user.name = username;
  return { username };
}

function randomMastermindAnswer(): string {
  return Array.from({ length: MASTERMIND_CODE_LENGTH }, () => {
    const color = MASTERMIND_COLORS[Math.floor(Math.random() * MASTERMIND_COLORS.length)];
    return color.id;
  }).join("");
}

function scoreFor(
  mode: GameMode,
  attemptNumber: number,
  wordLength = WORD_LENGTH,
): number {
  return getScoreForMode(mode, attemptNumber, wordLength);
}

function parseAttempts(json: string): Attempt[] {
  try {
    const value = JSON.parse(json);
    return Array.isArray(value) ? (value as Attempt[]) : [];
  } catch {
    return [];
  }
}

function parseMastermindAttempts(json: string): MastermindAttempt[] {
  try {
    const value = JSON.parse(json);
    return Array.isArray(value) ? (value as MastermindAttempt[]) : [];
  } catch {
    return [];
  }
}

async function dailyGameRow(
  db: Db,
  userId: string,
  dateKey: string,
): Promise<StoredDailyGame | null> {
  return (
    (await db
      .select()
      .from(dailyGamesTable)
      .where(
        and(eq(dailyGamesTable.userId, userId), eq(dailyGamesTable.dateKey, dateKey)),
      )
      .get()) ?? null
  );
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

async function activeMastermindGame(
  db: Db,
  userId: string,
): Promise<StoredMastermindGame | null> {
  return (
    (await db
      .select()
      .from(mastermindGamesTable)
      .where(
        and(
          eq(mastermindGamesTable.userId, userId),
          eq(mastermindGamesTable.status, "active"),
        ),
      )
      .orderBy(desc(mastermindGamesTable.createdAt))
      .limit(1)
      .get()) ?? null
  );
}

async function latestMastermindGame(
  db: Db,
  userId: string,
): Promise<StoredMastermindGame | null> {
  return (
    (await db
      .select()
      .from(mastermindGamesTable)
      .where(eq(mastermindGamesTable.userId, userId))
      .orderBy(desc(mastermindGamesTable.createdAt))
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

async function mastermindGamesPlayed(db: Db, userId: string): Promise<number> {
  const row = await db
    .select({ count: sql<number>`count(*)` })
    .from(mastermindGamesTable)
    .where(eq(mastermindGamesTable.userId, userId))
    .get();

  return Number(row?.count ?? 0);
}

async function getDailyGame(db: Db, user: AuthUser): Promise<GameState> {
  const dateKey = todayKey();
  const row = await dailyGameRow(db, user.userId, dateKey);
  const attempts = row ? parseAttempts(row.attempts) : [];
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
  played: number,
): EndlessGameState {
  if (!game || game.status === "abandoned") {
    return idleEndlessState(played);
  }

  const mappedAttempts = parseAttempts(game.attempts);
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
    wordLength: game.answer.length,
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

  return toEndlessGameState(latest, played);
}

function idleMastermindState(games: number): MastermindGameState {
  return {
    gameId: "",
    attempts: [],
    maxAttempts: MASTERMIND_MAX_ATTEMPTS,
    codeLength: MASTERMIND_CODE_LENGTH,
    solved: false,
    over: true,
    answer: [],
    status: "idle",
    gamesPlayed: games,
  };
}

function toMastermindGameState(
  game: StoredMastermindGame | null,
  played: number,
): MastermindGameState {
  if (!game || game.status === "abandoned") {
    return idleMastermindState(played);
  }

  const mappedAttempts = parseMastermindAttempts(game.attempts);
  const solved =
    game.status === "solved" || mappedAttempts.some((attempt) => attempt.solved);
  const failed =
    game.status === "failed" ||
    (!solved && mappedAttempts.length >= MASTERMIND_MAX_ATTEMPTS);
  const status: MastermindGameStatus = solved
    ? "solved"
    : failed
      ? "failed"
      : "active";

  return {
    gameId: game.id,
    attempts: mappedAttempts,
    maxAttempts: MASTERMIND_MAX_ATTEMPTS,
    codeLength: MASTERMIND_CODE_LENGTH,
    solved,
    over: status !== "active",
    answer: status === "active" ? [] : normalizeMastermindGuess(game.answer),
    status,
    gamesPlayed: played,
  };
}

async function getMastermindGame(
  db: Db,
  user: AuthUser,
): Promise<MastermindGameState> {
  const active = await activeMastermindGame(db, user.userId);
  const latest = active ?? (await latestMastermindGame(db, user.userId));
  const played = await mastermindGamesPlayed(db, user.userId);

  return toMastermindGameState(latest, played);
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
  if (!isKnownWord(guess, WORD_LENGTH)) {
    throw new Error("Ce mot n'est pas dans le dictionnaire.");
  }

  const row = await dailyGameRow(db, user.userId, dateKey);
  const previous = row ? parseAttempts(row.attempts) : [];
  if (
    previous.length >= MAX_ATTEMPTS ||
    previous.some((attempt) => Boolean(attempt.solved))
  ) {
    return getDailyGame(db, user);
  }

  const answer = getWordForDate(dateKey);
  const attemptNumber = previous.length + 1;
  const solved = guess === answer;
  const score = solved ? scoreFor("daily", attemptNumber) : 0;
  const timestamp = now();

  const attempt: Attempt = {
    id: crypto.randomUUID(),
    guess,
    pattern: getPattern(guess, answer),
    attemptNumber,
    solved,
    score,
    createdAt: timestamp,
  };
  const attempts = [...previous, attempt];

  if (row) {
    await db
      .update(dailyGamesTable)
      .set({
        userName: user.name,
        attempts: JSON.stringify(attempts),
        solved: solved ? 1 : row.solved,
        score: solved ? score : row.score,
        updatedAt: timestamp,
      })
      .where(eq(dailyGamesTable.id, row.id))
      .run();
  } else {
    await db
      .insert(dailyGamesTable)
      .values({
        id: crypto.randomUUID(),
        userId: user.userId,
        userName: user.name,
        dateKey,
        attempts: JSON.stringify(attempts),
        solved: solved ? 1 : 0,
        score,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .run();
  }

  return getDailyGame(db, user);
}

async function startEndlessGame(
  db: Db,
  user: AuthUser,
  rawWordLength: unknown = WORD_LENGTH,
): Promise<EndlessGameState> {
  const active = await activeEndlessGame(db, user.userId);
  const played = await gamesPlayed(db, user.userId);
  const wordLength = normalizeWordLength(rawWordLength);

  if (active) {
    return toEndlessGameState(active, played);
  }

  const gameId = crypto.randomUUID();
  const timestamp = now();

  await db
    .insert(endlessGamesTable)
    .values({
      id: gameId,
      userId: user.userId,
      userName: user.name,
      answer: randomWord(wordLength),
      status: "active",
      score: 0,
      attempts: "[]",
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .run();

  const game = await latestEndlessGame(db, user.userId);
  return toEndlessGameState(game, played + 1);
}

async function submitEndlessGuess(
  db: Db,
  user: AuthUser,
  rawGuess: string,
): Promise<EndlessGameState> {
  const game = await activeEndlessGame(db, user.userId);
  const wordLength = game?.answer.length ?? WORD_LENGTH;
  const guess = normalizeGuess(rawGuess, wordLength);

  if (!game) {
    throw new Error("Lance une manche libre avant de jouer.");
  }
  if (guess.length !== wordLength) {
    throw new Error(`Le mot doit faire ${wordLength} lettres.`);
  }
  if (!isKnownWord(guess, wordLength)) {
    throw new Error("Ce mot n'est pas dans le dictionnaire.");
  }

  const previous = parseAttempts(game.attempts);
  if (
    previous.length >= MAX_ATTEMPTS ||
    previous.some((attempt) => Boolean(attempt.solved))
  ) {
    return getEndlessGame(db, user);
  }

  const attemptNumber = previous.length + 1;
  const solved = guess === game.answer;
  const score = solved ? scoreFor("endless", attemptNumber, wordLength) : 0;
  const timestamp = now();

  const attempt: Attempt = {
    id: crypto.randomUUID(),
    guess,
    pattern: getPattern(guess, game.answer),
    attemptNumber,
    solved,
    score,
    createdAt: timestamp,
  };
  const attempts = [...previous, attempt];

  let status: EndlessGameStatus = game.status;
  let gameScore = game.score;
  if (solved) {
    status = "solved";
    gameScore = score;
  } else if (attemptNumber >= MAX_ATTEMPTS) {
    status = "failed";
    gameScore = -getEndlessLossPenalty(wordLength);
  }

  await db
    .update(endlessGamesTable)
    .set({
      attempts: JSON.stringify(attempts),
      status,
      score: gameScore,
      updatedAt: timestamp,
    })
    .where(eq(endlessGamesTable.id, game.id))
    .run();

  return getEndlessGame(db, user);
}

async function abandonEndlessGame(
  db: Db,
  user: AuthUser,
): Promise<EndlessGameState> {
  const game = await activeEndlessGame(db, user.userId);

  if (!game) {
    throw new Error("Aucune manche libre active à abandonner.");
  }

  await db
    .update(endlessGamesTable)
    .set({
      score: -getEndlessLossPenalty(game.answer.length),
      status: "abandoned",
      updatedAt: now(),
    })
    .where(eq(endlessGamesTable.id, game.id))
    .run();

  return getEndlessGame(db, user);
}

async function startMastermindGame(
  db: Db,
  user: AuthUser,
): Promise<MastermindGameState> {
  const active = await activeMastermindGame(db, user.userId);
  const played = await mastermindGamesPlayed(db, user.userId);

  if (active) {
    return toMastermindGameState(active, played);
  }

  const gameId = crypto.randomUUID();
  const timestamp = now();

  await db
    .insert(mastermindGamesTable)
    .values({
      id: gameId,
      userId: user.userId,
      userName: user.name,
      answer: randomMastermindAnswer(),
      status: "active",
      score: 0,
      attempts: "[]",
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .run();

  const game = await latestMastermindGame(db, user.userId);
  return toMastermindGameState(game, played + 1);
}

async function submitMastermindGuess(
  db: Db,
  user: AuthUser,
  rawGuess: unknown,
): Promise<MastermindGameState> {
  const game = await activeMastermindGame(db, user.userId);
  const guess = normalizeMastermindGuess(rawGuess);

  if (!game) {
    throw new Error("Lance une manche Mastermind avant de jouer.");
  }
  if (guess.length !== MASTERMIND_CODE_LENGTH) {
    throw new Error("Le code doit contenir quatre couleurs.");
  }

  const previous = parseMastermindAttempts(game.attempts);
  if (
    previous.length >= MASTERMIND_MAX_ATTEMPTS ||
    previous.some((attempt) => Boolean(attempt.solved))
  ) {
    return getMastermindGame(db, user);
  }

  const answer = normalizeMastermindGuess(game.answer);
  const attemptNumber = previous.length + 1;
  const feedback = getMastermindFeedback(guess, answer);
  const solved = feedback.exact === MASTERMIND_CODE_LENGTH;
  const score = solved ? scoreFor("mastermind", attemptNumber) : 0;
  const timestamp = now();

  const attempt: MastermindAttempt = {
    id: crypto.randomUUID(),
    guess,
    exact: feedback.exact,
    present: feedback.present,
    attemptNumber,
    solved,
    score,
    createdAt: timestamp,
  };
  const attempts = [...previous, attempt];

  let status: MastermindGameStatus = game.status;
  let gameScore = game.score;
  if (solved) {
    status = "solved";
    gameScore = score;
  } else if (attemptNumber >= MASTERMIND_MAX_ATTEMPTS) {
    status = "failed";
    gameScore = 0;
  }

  await db
    .update(mastermindGamesTable)
    .set({
      attempts: JSON.stringify(attempts),
      status,
      score: gameScore,
      updatedAt: timestamp,
    })
    .where(eq(mastermindGamesTable.id, game.id))
    .run();

  return getMastermindGame(db, user);
}

async function abandonMastermindGame(
  db: Db,
  user: AuthUser,
): Promise<MastermindGameState> {
  const game = await activeMastermindGame(db, user.userId);

  if (!game) {
    throw new Error("Aucune manche Mastermind active à abandonner.");
  }

  await db
    .update(mastermindGamesTable)
    .set({ score: 0, status: "abandoned", updatedAt: now() })
    .where(eq(mastermindGamesTable.id, game.id))
    .run();

  return getMastermindGame(db, user);
}

type ScoreEvent = {
  mode: GameMode;
  score: number;
  // Une victoire compte comme partie résolue ; une pénalité de défaite/abandon
  // (score négatif) grignote le score du mode sans incrémenter les compteurs.
  solved: boolean;
  userId: string;
  userName: string;
  createdAt: string;
};

// Les événements doivent être appliqués dans l'ordre chronologique : le score du
// mode libre est plafonné à 0 au fil de l'eau, donc on ne peut jamais tomber dans
// le négatif ni accumuler une "dette" de smotucoins.
function addScore(
  entries: Record<string, GlobalLeaderboardEntry>,
  event: ScoreEvent,
) {
  const current =
    entries[event.userId] ??
    ({
      userId: event.userId,
      userName: event.userName,
      totalScore: 0,
      dailyScore: 0,
      endlessScore: 0,
      mastermindScore: 0,
      dailySolved: 0,
      endlessSolved: 0,
      mastermindSolved: 0,
      gamesSolved: 0,
      lastScoredAt: event.createdAt,
    } satisfies GlobalLeaderboardEntry);

  current.userName = event.userName;

  if (event.mode === "daily") {
    current.dailyScore = Math.max(0, current.dailyScore + event.score);
    if (event.solved) current.dailySolved += 1;
  } else if (event.mode === "endless") {
    current.endlessScore = Math.max(0, current.endlessScore + event.score);
    if (event.solved) current.endlessSolved += 1;
  } else {
    current.mastermindScore = Math.max(0, current.mastermindScore + event.score);
    if (event.solved) current.mastermindSolved += 1;
  }

  current.totalScore =
    current.dailyScore + current.endlessScore + current.mastermindScore;

  if (event.solved) {
    current.gamesSolved += 1;
    current.lastScoredAt =
      current.lastScoredAt > event.createdAt ? current.lastScoredAt : event.createdAt;
  }

  entries[event.userId] = current;
}

async function leaderboardRows(db: Db) {
  // Tout le scoring se lit désormais depuis les tables de parties (une ligne par
  // partie), qui stockent le score final et le statut. Plus besoin de scanner
  // l'historique des coups.
  const daily = await db
    .select({
      userId: dailyGamesTable.userId,
      userName: dailyGamesTable.userName,
      score: dailyGamesTable.score,
      createdAt: dailyGamesTable.createdAt,
    })
    .from(dailyGamesTable)
    .where(eq(dailyGamesTable.solved, 1))
    .orderBy(asc(dailyGamesTable.createdAt))
    .all();

  const endless = await db
    .select({
      userId: endlessGamesTable.userId,
      userName: endlessGamesTable.userName,
      score: endlessGamesTable.score,
      createdAt: endlessGamesTable.createdAt,
    })
    .from(endlessGamesTable)
    .where(eq(endlessGamesTable.status, "solved"))
    .orderBy(asc(endlessGamesTable.createdAt))
    .all();

  // Manches libres perdues ou abandonnées : leur score stocké est négatif (la
  // pénalité). L'horodatage de la perte, c'est updatedAt.
  const endlessPenalties = await db
    .select({
      userId: endlessGamesTable.userId,
      userName: endlessGamesTable.userName,
      score: endlessGamesTable.score,
      updatedAt: endlessGamesTable.updatedAt,
    })
    .from(endlessGamesTable)
    .where(
      and(
        inArray(endlessGamesTable.status, ["failed", "abandoned"]),
        lt(endlessGamesTable.score, 0),
      ),
    )
    .orderBy(asc(endlessGamesTable.updatedAt))
    .all();

  const mastermind = await db
    .select({
      userId: mastermindGamesTable.userId,
      userName: mastermindGamesTable.userName,
      score: mastermindGamesTable.score,
      createdAt: mastermindGamesTable.createdAt,
    })
    .from(mastermindGamesTable)
    .where(eq(mastermindGamesTable.status, "solved"))
    .orderBy(asc(mastermindGamesTable.createdAt))
    .all();

  return { daily, endless, endlessPenalties, mastermind };
}

async function leaderboardImages(db: Db): Promise<Record<string, string>> {
  const rows = await db
    .select({
      userId: usersTable.userId,
      image: authUser.image,
    })
    .from(usersTable)
    .leftJoin(authUser, eq(usersTable.authUserId, authUser.id))
    .all();

  return Object.fromEntries(
    rows
      .filter((row): row is { userId: string; image: string } => Boolean(row.image))
      .map((row) => [row.userId, row.image]),
  );
}

function scoreEvents({
  daily,
  endless,
  endlessPenalties,
  mastermind,
}: Awaited<ReturnType<typeof leaderboardRows>>) {
  const dailyEvents: ScoreEvent[] = daily.map((row) => ({
    userId: row.userId,
    userName: row.userName,
    mode: "daily",
    score: row.score,
    solved: true,
    createdAt: row.createdAt,
  }));

  const endlessWinEvents: ScoreEvent[] = endless.map((row) => ({
    userId: row.userId,
    userName: row.userName,
    mode: "endless",
    score: row.score,
    solved: true,
    createdAt: row.createdAt,
  }));

  const endlessPenaltyEvents: ScoreEvent[] = endlessPenalties.map((row) => ({
    userId: row.userId,
    userName: row.userName,
    mode: "endless",
    score: row.score, // déjà négatif
    solved: false,
    createdAt: row.updatedAt,
  }));

  // Le plafonnement à 0 se fait au fil de l'eau : victoires et pénalités du mode
  // libre doivent donc être fusionnées dans l'ordre chronologique.
  const endlessEvents = [...endlessWinEvents, ...endlessPenaltyEvents].sort(
    (left, right) =>
      left.createdAt < right.createdAt
        ? -1
        : left.createdAt > right.createdAt
          ? 1
          : 0,
  );

  const mastermindEvents: ScoreEvent[] = mastermind.map((row) => ({
    userId: row.userId,
    userName: row.userName,
    mode: "mastermind",
    score: row.score,
    solved: true,
    createdAt: row.createdAt,
  }));

  return {
    daily: dailyEvents,
    endless: endlessEvents,
    mastermind: mastermindEvents,
    all: [...dailyEvents, ...endlessEvents, ...mastermindEvents],
  };
}

function solvedForMode(entry: GlobalLeaderboardEntry, mode: GameMode): number {
  if (mode === "daily") {
    return entry.dailySolved;
  }
  if (mode === "endless") {
    return entry.endlessSolved;
  }
  return entry.mastermindSolved;
}

function scoreForEntryMode(entry: GlobalLeaderboardEntry, mode: GameMode): number {
  if (mode === "daily") {
    return entry.dailyScore;
  }
  if (mode === "endless") {
    return entry.endlessScore;
  }
  return entry.mastermindScore;
}

function withImages(
  leaderboard: GlobalLeaderboardEntry[],
  images: Record<string, string>,
): GlobalLeaderboardEntry[] {
  return leaderboard.map((entry) => ({
    ...entry,
    userImage: images[entry.userId],
  }));
}

function buildLeaderboard(
  events: ScoreEvent[],
  sortMode: "score" | GameMode = "score",
): GlobalLeaderboardEntry[] {
  const entries: Record<string, GlobalLeaderboardEntry> = {};

  for (const event of events) {
    addScore(entries, event);
  }

  return Object.values(entries)
    .sort((left, right) => {
      if (sortMode !== "score") {
        const rightSolved = solvedForMode(right, sortMode);
        const leftSolved = solvedForMode(left, sortMode);
        if (rightSolved !== leftSolved) {
          return rightSolved - leftSolved;
        }

        const rightScore = scoreForEntryMode(right, sortMode);
        const leftScore = scoreForEntryMode(left, sortMode);
        if (rightScore !== leftScore) {
          return rightScore - leftScore;
        }
      }

      if (right.totalScore !== left.totalScore) {
        return right.totalScore - left.totalScore;
      }
      return left.lastScoredAt < right.lastScoredAt ? -1 : 1;
    });
}

async function leaderboards(db: Db): Promise<LeaderboardSet> {
  const events = scoreEvents(await leaderboardRows(db));
  const images = await leaderboardImages(db);

  return {
    global: withImages(buildLeaderboard(events.all).slice(0, 30), images),
    daily: withImages(buildLeaderboard(events.daily, "daily").slice(0, 30), images),
    endless: withImages(
      buildLeaderboard(events.endless, "endless").slice(0, 30),
      images,
    ),
    mastermind: withImages(
      buildLeaderboard(events.mastermind, "mastermind").slice(0, 30),
      images,
    ),
  };
}

async function globalLeaderboard(db: Db): Promise<GlobalLeaderboardEntry[]> {
  return (await leaderboards(db)).global;
}

async function profileStats(db: Db, user: AuthUser): Promise<ProfileStats> {
  const rows = await leaderboardRows(db);
  const leaderboard = buildLeaderboard(scoreEvents(rows).all);
  const index = leaderboard.findIndex((entry) => entry.userId === user.userId);
  const entry = index >= 0 ? leaderboard[index] : undefined;
  const dailySolved = rows.daily.filter((row) => row.userId === user.userId).length;
  const endlessSolved = rows.endless.filter((row) => row.userId === user.userId).length;
  const mastermindSolved = rows.mastermind.filter(
    (row) => row.userId === user.userId,
  ).length;

  return {
    userId: user.userId,
    userName: entry?.userName ?? user.name,
    userImage: user.picture,
    totalScore: entry?.totalScore ?? 0,
    dailyScore: entry?.dailyScore ?? 0,
    endlessScore: entry?.endlessScore ?? 0,
    mastermindScore: entry?.mastermindScore ?? 0,
    gamesSolved: entry?.gamesSolved ?? 0,
    dailySolved,
    endlessSolved,
    mastermindSolved,
    lastScoredAt: entry?.lastScoredAt ?? "",
    rank: index >= 0 ? index + 1 : null,
  };
}

async function adminOverview(user: AuthUser) {
  const dateKey = todayKey();

  return {
    currentUser: {
      id: user.authUserId,
      email: user.email ?? "",
      name: user.name,
      role: user.role ?? "admin",
    },
    currentSession: {
      id: user.sessionId,
      token: user.sessionToken,
    },
    today: {
      dateKey,
      word: getWordForDate(dateKey),
      wordLength: WORD_LENGTH,
    },
  };
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

  if (request.method === "GET" && url.pathname === "/api/leaderboards") {
    return json(await leaderboards(db));
  }

  if (request.method === "GET" && url.pathname === "/api/leaderboard/global") {
    return json(await globalLeaderboard(db));
  }

  if (request.method === "GET" && url.pathname === "/api/admin/overview") {
    const adminUser = await requireAdmin(request, env, db);
    await ensureUserProfile(db, adminUser);
    return json(await adminOverview(adminUser));
  }

  const user = await requireUser(request, env);
  await ensureUserProfile(db, user);

  if (request.method === "GET" && url.pathname === "/api/session") {
    return json({ user });
  }

  if (request.method === "GET" && url.pathname === "/api/profile") {
    return json(await profileStats(db, user));
  }

  if (request.method === "POST" && url.pathname === "/api/profile/username") {
    const body = await requestBody(request);
    return json(await setUsername(db, user, String(body.username ?? "")));
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
    const body = await requestBody(request);
    return json(await startEndlessGame(db, user, body.wordLength));
  }

  if (request.method === "POST" && url.pathname === "/api/game/endless/guess") {
    const body = await requestBody(request);
    return json(await submitEndlessGuess(db, user, String(body.guess ?? "")));
  }

  if (request.method === "POST" && url.pathname === "/api/game/endless/abandon") {
    return json(await abandonEndlessGame(db, user));
  }

  if (request.method === "GET" && url.pathname === "/api/game/mastermind") {
    return json(await getMastermindGame(db, user));
  }

  if (request.method === "POST" && url.pathname === "/api/game/mastermind/start") {
    return json(await startMastermindGame(db, user));
  }

  if (request.method === "POST" && url.pathname === "/api/game/mastermind/guess") {
    const body = await requestBody(request);
    return json(await submitMastermindGuess(db, user, body.guess));
  }

  if (
    request.method === "POST" &&
    url.pathname === "/api/game/mastermind/abandon"
  ) {
    return json(await abandonMastermindGame(db, user));
  }

  return error("Not found", 404);
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    const auth = createAuth(env, request);

    if (url.pathname === "/api/auth/error") {
      const redirectURL = new URL("/auth/error", url.origin);
      redirectURL.search = url.search;
      return Response.redirect(redirectURL.toString(), 302);
    }

    if (url.pathname.startsWith("/api/auth/")) {
      await ensureSchema(database(env));
      return auth.handler(request);
    }

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
