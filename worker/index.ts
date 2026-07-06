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
  smotucoinsEarned,
  type Attempt,
  type EndlessGameState,
  type EndlessGameStatus,
  type GameMode,
  type GameState,
  type FriendProfile,
  type FriendRequest,
  type FriendshipStatus,
  type FriendsState,
  type GlobalLeaderboardEntry,
  type LeaderboardSet,
  type MastermindAttempt,
  type MastermindGameState,
  type MastermindGameStatus,
  type PlayerSearchResult,
  type ProfileInventorySummary,
  type ProfileRecentGame,
  type ProfileStats,
  type PublicPlayerProfile,
  DEFAULT_PUBLIC_AVATAR,
  DEFAULT_SHOP_EQUIPMENT,
  SHOP_ITEMS,
  SHOP_SECTIONS,
  defaultOwnedItemIds,
  publicAvatarFromEquipment,
  shopItemById,
  type PublicAvatar,
  type ShopCategory,
  type ShopEquipSlot,
  type ShopEquipment,
  type ShopInventory,
  type ShopItemId,
  type ShopState,
  type TileState,
  type AdminGameStatus,
  type AdminUserGame,
  type AdminUserGamesData,
} from "../shared/game";
import {
  dailyGames as dailyGamesTable,
  endlessGames as endlessGamesTable,
  friendRequests as friendRequestsTable,
  friendships as friendshipsTable,
  users as usersTable,
  mastermindGames as mastermindGamesTable,
  shopEquipment as shopEquipmentTable,
  shopPurchases as shopPurchasesTable,
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
  "CREATE TABLE IF NOT EXISTS shop_purchases (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, item_id TEXT NOT NULL, quantity INTEGER NOT NULL DEFAULT 1, spent INTEGER NOT NULL, created_at TEXT NOT NULL)",
  "CREATE INDEX IF NOT EXISTS shop_purchases_user_idx ON shop_purchases (user_id, created_at)",
  "CREATE TABLE IF NOT EXISTS shop_equipment (user_id TEXT NOT NULL, slot TEXT NOT NULL, item_id TEXT NOT NULL, updated_at TEXT NOT NULL)",
  "CREATE UNIQUE INDEX IF NOT EXISTS shop_equipment_user_slot_idx ON shop_equipment (user_id, slot)",
  "CREATE TABLE IF NOT EXISTS friendships (user_id TEXT NOT NULL, friend_user_id TEXT NOT NULL, created_at TEXT NOT NULL)",
  "CREATE UNIQUE INDEX IF NOT EXISTS friendships_user_friend_idx ON friendships (user_id, friend_user_id)",
  "CREATE TABLE IF NOT EXISTS friend_requests (id TEXT PRIMARY KEY, from_user_id TEXT NOT NULL, to_user_id TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
  "CREATE UNIQUE INDEX IF NOT EXISTS friend_requests_pair_pending_idx ON friend_requests (from_user_id, to_user_id, status)",
  "CREATE INDEX IF NOT EXISTS friend_requests_to_status_idx ON friend_requests (to_user_id, status)",
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
      const key = `${row.user_id}${row.date_key}`;
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

function fallbackName(userId: string): string {
  return `Joueur ${userId.slice(-6)}`;
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
    name: fallbackName(userId),
    email: session.user.email,
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

function publicUserId(userId: string): string {
  let hash = 2166136261;
  for (let index = 0; index < userId.length; index += 1) {
    hash ^= userId.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `player:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

async function internalUserIdFromPublicId(
  db: Db,
  publicId: string,
): Promise<string | null> {
  const id = publicId.trim();
  if (!id.startsWith("player:")) {
    return null;
  }

  const rows = await db.select({ userId: usersTable.userId }).from(usersTable).all();
  return rows.find((row) => publicUserId(row.userId) === id)?.userId ?? null;
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

// Le profil public est toujours le username Smotu. Les infos du fournisseur
// d'authentification restent internes au compte et ne pilotent pas l'identité UI.
async function ensureUserProfile(db: Db, user: AuthUser): Promise<void> {
  const timestamp = now();

  await db
    .update(authUser)
    .set({ image: null })
    .where(eq(authUser.id, user.authUserId))
    .run();

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
  // le pseudo Smotu courant soit celui que le classement relit partout.
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
    // On masque le mot tant que la manche est active pour ne pas le divulguer.
    // En dev (`import.meta.env.DEV`, remplacé par `false` au build de prod) on le
    // révèle pour l'aide au debug affichée dans le plateau.
    answer: status === "active" && !(import.meta as any).env?.DEV ? "" : game.answer,
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
      publicAvatar: DEFAULT_PUBLIC_AVATAR,
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

async function publicAvatarForUser(db: Db, userId: string): Promise<PublicAvatar> {
  const [purchases, equipmentRows] = await Promise.all([
    shopPurchaseRows(db, userId),
    shopEquipmentRows(db, userId),
  ]);
  const ownedItemIds = ownedItemIdsFromPurchases(purchases);
  return publicAvatarFromEquipment(equipmentFromRows(equipmentRows, ownedItemIds));
}

// Version groupée : au lieu de 2 requêtes D1 (achats + équipement) PAR utilisateur,
// on récupère tout le monde en 2 requêtes via inArray puis on regroupe en mémoire.
// Indispensable pour rester dans les quotas Workers/D1 sur les listes (classement,
// recherche, amis) où le N+1 explose vite.
async function publicAvatarsForUsers(
  db: Db,
  userIds: string[],
): Promise<Record<string, PublicAvatar>> {
  const ids = Array.from(new Set(userIds));
  if (ids.length === 0) {
    return {};
  }

  const [purchaseRows, equipmentRows] = await Promise.all([
    db
      .select({
        userId: shopPurchasesTable.userId,
        id: shopPurchasesTable.id,
        itemId: shopPurchasesTable.itemId,
        quantity: shopPurchasesTable.quantity,
        spent: shopPurchasesTable.spent,
        createdAt: shopPurchasesTable.createdAt,
      })
      .from(shopPurchasesTable)
      .where(inArray(shopPurchasesTable.userId, ids))
      .all(),
    db
      .select({
        userId: shopEquipmentTable.userId,
        slot: shopEquipmentTable.slot,
        itemId: shopEquipmentTable.itemId,
      })
      .from(shopEquipmentTable)
      .where(inArray(shopEquipmentTable.userId, ids))
      .all(),
  ]);

  const purchasesByUser = new Map<string, ShopPurchaseRow[]>();
  for (const row of purchaseRows) {
    const list = purchasesByUser.get(row.userId) ?? [];
    list.push(row);
    purchasesByUser.set(row.userId, list);
  }

  const equipmentByUser = new Map<string, ShopEquipmentRow[]>();
  for (const row of equipmentRows) {
    const list = equipmentByUser.get(row.userId) ?? [];
    list.push(row);
    equipmentByUser.set(row.userId, list);
  }

  const avatars: Record<string, PublicAvatar> = {};
  for (const userId of ids) {
    const purchases = purchasesByUser.get(userId) ?? [];
    const ownedItemIds = ownedItemIdsFromPurchases(purchases);
    const equipment = equipmentByUser.get(userId) ?? [];
    avatars[userId] = publicAvatarFromEquipment(
      equipmentFromRows(equipment, ownedItemIds),
    );
  }

  return avatars;
}

async function publicAvatarsForLeaderboard(
  db: Db,
  leaderboards: GlobalLeaderboardEntry[][],
): Promise<Record<string, PublicAvatar>> {
  const userIds = leaderboards.flatMap((leaderboard) =>
    leaderboard.map((entry) => entry.userId),
  );
  return publicAvatarsForUsers(db, userIds);
}

async function publicUsernamesForLeaderboard(
  db: Db,
  leaderboards: GlobalLeaderboardEntry[][],
): Promise<Record<string, string>> {
  const userIds = Array.from(
    new Set(leaderboards.flatMap((leaderboard) => leaderboard.map((entry) => entry.userId))),
  );
  if (userIds.length === 0) {
    return {};
  }

  const rows = await db
    .select({
      userId: usersTable.userId,
      username: usersTable.username,
    })
    .from(usersTable)
    .where(inArray(usersTable.userId, userIds))
    .all();

  return Object.fromEntries(rows.map((row) => [row.userId, row.username]));
}

function withPublicProfiles(
  leaderboard: GlobalLeaderboardEntry[],
  avatars: Record<string, PublicAvatar>,
  names: Record<string, string>,
): GlobalLeaderboardEntry[] {
  return leaderboard.map((entry) => ({
    ...entry,
    userId: publicUserId(entry.userId),
    userName: names[entry.userId] ?? entry.userName,
    publicAvatar: avatars[entry.userId] ?? DEFAULT_PUBLIC_AVATAR,
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
  const global = buildLeaderboard(events.all).slice(0, 30);
  const daily = buildLeaderboard(events.daily, "daily").slice(0, 30);
  const endless = buildLeaderboard(events.endless, "endless").slice(0, 30);
  const mastermind = buildLeaderboard(events.mastermind, "mastermind").slice(0, 30);
  const publicBoards = [global, daily, endless, mastermind];
  const [avatars, names] = await Promise.all([
    publicAvatarsForLeaderboard(db, publicBoards),
    publicUsernamesForLeaderboard(db, publicBoards),
  ]);

  return {
    global: withPublicProfiles(global, avatars, names),
    daily: withPublicProfiles(daily, avatars, names),
    endless: withPublicProfiles(endless, avatars, names),
    mastermind: withPublicProfiles(mastermind, avatars, names),
  };
}

async function globalLeaderboard(db: Db): Promise<GlobalLeaderboardEntry[]> {
  return (await leaderboards(db)).global;
}

async function publicNameForUser(db: Db, userId: string): Promise<string> {
  const row = await db
    .select({ username: usersTable.username })
    .from(usersTable)
    .where(eq(usersTable.userId, userId))
    .get();
  return row?.username ?? fallbackName(userId);
}

async function profileRecentGames(
  db: Db,
  userId: string,
  limit = 8,
): Promise<ProfileRecentGame[]> {
  const [daily, endless, mastermind] = await Promise.all([
    db
      .select()
      .from(dailyGamesTable)
      .where(eq(dailyGamesTable.userId, userId))
      .orderBy(desc(dailyGamesTable.updatedAt))
      .limit(limit)
      .all(),
    db
      .select()
      .from(endlessGamesTable)
      .where(eq(endlessGamesTable.userId, userId))
      .orderBy(desc(endlessGamesTable.updatedAt))
      .limit(limit)
      .all(),
    db
      .select()
      .from(mastermindGamesTable)
      .where(eq(mastermindGamesTable.userId, userId))
      .orderBy(desc(mastermindGamesTable.updatedAt))
      .limit(limit)
      .all(),
  ]);

  const games: ProfileRecentGame[] = [];

  for (const row of daily) {
    const attempts = parseAttempts(row.attempts);
    const solved = Boolean(row.solved) || attempts.some((attempt) => attempt.solved);
    games.push({
      id: row.id,
      mode: "daily",
      status: solved ? "solved" : attempts.length >= MAX_ATTEMPTS ? "failed" : "active",
      score: row.score,
      attemptCount: attempts.length,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  for (const row of endless) {
    const attempts = parseAttempts(row.attempts);
    const solved = row.status === "solved" || attempts.some((attempt) => attempt.solved);
    games.push({
      id: row.id,
      mode: "endless",
      status:
        row.status === "abandoned"
          ? "abandoned"
          : solved
            ? "solved"
            : row.status === "failed" || attempts.length >= MAX_ATTEMPTS
              ? "failed"
              : "active",
      score: row.score,
      attemptCount: attempts.length,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  for (const row of mastermind) {
    const attempts = parseMastermindAttempts(row.attempts);
    const solved = row.status === "solved" || attempts.some((attempt) => attempt.solved);
    games.push({
      id: row.id,
      mode: "mastermind",
      status:
        row.status === "abandoned"
          ? "abandoned"
          : solved
            ? "solved"
            : row.status === "failed" || attempts.length >= MASTERMIND_MAX_ATTEMPTS
              ? "failed"
              : "active",
      score: row.score,
      attemptCount: attempts.length,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  return games
    .sort((left, right) =>
      left.updatedAt < right.updatedAt
        ? 1
        : left.updatedAt > right.updatedAt
          ? -1
          : 0,
    )
    .slice(0, limit);
}

async function profileInventorySummary(
  db: Db,
  userId: string,
  coinsEarned: number,
): Promise<ProfileInventorySummary> {
  const [purchases, equipmentRows] = await Promise.all([
    shopPurchaseRows(db, userId),
    shopEquipmentRows(db, userId),
  ]);
  const ownedItemIds = ownedItemIdsFromPurchases(purchases);
  const equipped = equipmentFromRows(equipmentRows, ownedItemIds, purchases);
  const consumables = hintCounts(purchases);
  // Solde de smotucoins : récompenses fixes par victoire moins les dépenses.
  // Remboursement auto des items retirés du catalogue (ex. contours) : on ne compte
  // que les achats dont l'itemId est encore valide, les smotucoins dépensés sur des
  // items supprimés reviennent donc automatiquement dans la balance.
  const lifetimeSpent = purchases.reduce(
    (total, row) => (normalizeShopItemId(row.itemId) ? total + row.spent : total),
    0,
  );
  const balance = Math.max(0, coinsEarned - lifetimeSpent);
  const ownedCosmetics = ownedItemIds.filter((itemId) => {
    const item = shopItemById(itemId);
    return item && !item.repeatable;
  });
  const ownedThemeIds = ownedItemIds.filter((itemId): itemId is ShopItemId => {
    const item = shopItemById(itemId);
    return item?.category === "theme" && !item.repeatable;
  });

  return {
    balance,
    equipped,
    ownedCount: ownedCosmetics.length,
    ownedThemeIds,
    totalItems: SHOP_ITEMS.filter((item) => !item.repeatable).length,
    consumables: {
      hintLetter: consumables.hintLetterCount,
      hintPosition: consumables.hintPositionCount,
      hintMastermind: consumables.hintMastermindCount,
    },
    publicAvatar: publicAvatarFromEquipment(equipped),
  };
}

async function profileStatsForUser(
  db: Db,
  userId: string,
): Promise<ProfileStats> {
  const rows = await leaderboardRows(db);
  const leaderboard = buildLeaderboard(scoreEvents(rows).all);
  const index = leaderboard.findIndex((entry) => entry.userId === userId);
  const entry = index >= 0 ? leaderboard[index] : undefined;
  const dailySolved = rows.daily.filter((row) => row.userId === userId).length;
  const endlessSolved = rows.endless.filter((row) => row.userId === userId).length;
  const mastermindSolved = rows.mastermind.filter(
    (row) => row.userId === userId,
  ).length;
  const [userName, inventory, recentGames] = await Promise.all([
    publicNameForUser(db, userId),
    profileInventorySummary(
      db,
      userId,
      smotucoinsEarned(dailySolved, endlessSolved, mastermindSolved),
    ),
    profileRecentGames(db, userId),
  ]);

  return {
    userId: publicUserId(userId),
    userName,
    publicAvatar: inventory.publicAvatar,
    totalScore: entry?.totalScore ?? 0,
    dailyScore: entry?.dailyScore ?? 0,
    endlessScore: entry?.endlessScore ?? 0,
    mastermindScore: entry?.mastermindScore ?? 0,
    gamesSolved: entry?.gamesSolved ?? 0,
    dailySolved,
    endlessSolved,
    mastermindSolved,
    lastScoredAt: entry?.lastScoredAt ?? "",
    inventory,
    rank: index >= 0 ? index + 1 : null,
    recentGames,
  };
}

async function profileStats(db: Db, user: AuthUser): Promise<ProfileStats> {
  return profileStatsForUser(db, user.userId);
}

async function friendshipStatus(
  db: Db,
  viewerUserId: string,
  targetUserId: string,
): Promise<FriendshipStatus> {
  if (viewerUserId === targetUserId) {
    return "self";
  }

  const friend = await db
    .select({ friendUserId: friendshipsTable.friendUserId })
    .from(friendshipsTable)
    .where(
      and(
        eq(friendshipsTable.userId, viewerUserId),
        eq(friendshipsTable.friendUserId, targetUserId),
      ),
    )
    .get();
  if (friend) {
    return "friend";
  }

  const outgoing = await db
    .select({ id: friendRequestsTable.id })
    .from(friendRequestsTable)
    .where(
      and(
        eq(friendRequestsTable.fromUserId, viewerUserId),
        eq(friendRequestsTable.toUserId, targetUserId),
        eq(friendRequestsTable.status, "pending"),
      ),
    )
    .get();
  if (outgoing) {
    return "outgoing";
  }

  const incoming = await db
    .select({ id: friendRequestsTable.id })
    .from(friendRequestsTable)
    .where(
      and(
        eq(friendRequestsTable.fromUserId, targetUserId),
        eq(friendRequestsTable.toUserId, viewerUserId),
        eq(friendRequestsTable.status, "pending"),
      ),
    )
    .get();
  return incoming ? "incoming" : "none";
}

async function publicPlayerProfile(
  db: Db,
  viewer: AuthUser,
  publicId: string,
): Promise<PublicPlayerProfile> {
  const targetUserId = await internalUserIdFromPublicId(db, publicId);
  if (!targetUserId) {
    throw new Error("Joueur introuvable.");
  }

  const [stats, status] = await Promise.all([
    profileStatsForUser(db, targetUserId),
    friendshipStatus(db, viewer.userId, targetUserId),
  ]);
  // Le solde smotucoin est un porte-monnaie (à terme achetable en argent réel) :
  // il reste privé, on ne l'expose pas sur les profils publics.
  return {
    ...stats,
    inventory: { ...stats.inventory, balance: 0 },
    friendshipStatus: status,
  };
}

async function friendProfile(
  db: Db,
  userId: string,
  avatar?: PublicAvatar,
): Promise<FriendProfile> {
  // `avatar` permet de réutiliser un lot d'avatars déjà chargé en masse
  // (publicAvatarsForUsers) ; sinon on retombe sur la requête unitaire.
  const [userName, publicAvatar] = await Promise.all([
    publicNameForUser(db, userId),
    avatar ?? publicAvatarForUser(db, userId),
  ]);
  return {
    userId: publicUserId(userId),
    userName,
    publicAvatar,
  };
}

async function playerSearch(
  db: Db,
  viewer: AuthUser,
  query: string,
): Promise<PlayerSearchResult[]> {
  const normalized = cleanUsername(query).toLowerCase();
  const rows =
    normalized.length >= 2
      ? await db
          .select({
            userId: usersTable.userId,
            username: usersTable.username,
          })
          .from(usersTable)
          .where(sql`lower(${usersTable.username}) like ${`%${normalized}%`}`)
          .orderBy(asc(usersTable.username))
          .limit(12)
          .all()
      : await db
          .select({
            userId: usersTable.userId,
            username: usersTable.username,
          })
          .from(usersTable)
          .orderBy(desc(usersTable.updatedAt))
          .limit(8)
          .all();

  const leaderboard = buildLeaderboard(scoreEvents(await leaderboardRows(db)).all);
  const ranked = new Map(
    leaderboard.map((entry, index) => [
      entry.userId,
      {
        entry,
        rank: index + 1,
      },
    ]),
  );

  // Avatars des résultats en 2 requêtes groupées plutôt qu'un N+1 par ligne.
  const avatars = await publicAvatarsForUsers(db, rows.map((row) => row.userId));

  return Promise.all(
    rows.map(async (row) => {
      const score = ranked.get(row.userId);
      return {
        userId: publicUserId(row.userId),
        userName: row.username,
        publicAvatar: avatars[row.userId] ?? DEFAULT_PUBLIC_AVATAR,
        totalScore: score?.entry.totalScore ?? 0,
        rank: score?.rank ?? null,
        gamesSolved: score?.entry.gamesSolved ?? 0,
        friendshipStatus: await friendshipStatus(db, viewer.userId, row.userId),
      };
    }),
  );
}

async function resolveFriendTargetUserId(
  db: Db,
  rawTarget: unknown,
): Promise<string | null> {
  const target = String(rawTarget ?? "").trim();
  if (!target) {
    return null;
  }

  if (target.startsWith("player:")) {
    return internalUserIdFromPublicId(db, target);
  }

  const username = cleanUsername(target).toLowerCase();
  const row = await db
    .select({ userId: usersTable.userId })
    .from(usersTable)
    .where(sql`lower(${usersTable.username}) = ${username}`)
    .get();
  return row?.userId ?? null;
}

async function friendsState(db: Db, user: AuthUser): Promise<FriendsState> {
  const [friendRows, incomingRows, outgoingRows] = await Promise.all([
    db
      .select({ friendUserId: friendshipsTable.friendUserId })
      .from(friendshipsTable)
      .where(eq(friendshipsTable.userId, user.userId))
      .orderBy(desc(friendshipsTable.createdAt))
      .all(),
    db
      .select({
        id: friendRequestsTable.id,
        fromUserId: friendRequestsTable.fromUserId,
        createdAt: friendRequestsTable.createdAt,
      })
      .from(friendRequestsTable)
      .where(
        and(
          eq(friendRequestsTable.toUserId, user.userId),
          eq(friendRequestsTable.status, "pending"),
        ),
      )
      .orderBy(desc(friendRequestsTable.createdAt))
      .all(),
    db
      .select({
        id: friendRequestsTable.id,
        toUserId: friendRequestsTable.toUserId,
        createdAt: friendRequestsTable.createdAt,
      })
      .from(friendRequestsTable)
      .where(
        and(
          eq(friendRequestsTable.fromUserId, user.userId),
          eq(friendRequestsTable.status, "pending"),
        ),
      )
      .orderBy(desc(friendRequestsTable.createdAt))
      .all(),
  ]);

  // Avatars des amis et des demandes en 2 requêtes groupées (quotas Workers/D1)
  // plutôt qu'un N+1 caché dans chaque friendProfile.
  const avatars = await publicAvatarsForUsers(db, [
    ...friendRows.map((row) => row.friendUserId),
    ...incomingRows.map((row) => row.fromUserId),
    ...outgoingRows.map((row) => row.toUserId),
  ]);

  const friends = await Promise.all(
    friendRows.map((row) =>
      friendProfile(db, row.friendUserId, avatars[row.friendUserId]),
    ),
  );
  const incomingRequests: FriendRequest[] = await Promise.all(
    incomingRows.map(async (row) => ({
      id: row.id,
      createdAt: row.createdAt,
      user: await friendProfile(db, row.fromUserId, avatars[row.fromUserId]),
    })),
  );
  const outgoingRequests: FriendRequest[] = await Promise.all(
    outgoingRows.map(async (row) => ({
      id: row.id,
      createdAt: row.createdAt,
      user: await friendProfile(db, row.toUserId, avatars[row.toUserId]),
    })),
  );

  return { friends, incomingRequests, outgoingRequests };
}

async function requestFriend(
  db: Db,
  user: AuthUser,
  rawTarget: unknown,
): Promise<FriendsState> {
  const targetUserId = await resolveFriendTargetUserId(db, rawTarget);
  if (!targetUserId) {
    throw new Error("Joueur introuvable.");
  }

  const status = await friendshipStatus(db, user.userId, targetUserId);
  if (status === "self") {
    throw new Error("Tu ne peux pas t'envoyer une demande.");
  }
  if (status === "friend") {
    throw new Error("Ce joueur est déjà dans tes amis.");
  }
  if (status === "outgoing") {
    throw new Error("Demande déjà envoyée.");
  }
  if (status === "incoming") {
    throw new Error("Ce joueur t'a déjà envoyé une demande.");
  }

  const timestamp = now();
  await db
    .insert(friendRequestsTable)
    .values({
      id: crypto.randomUUID(),
      fromUserId: user.userId,
      toUserId: targetUserId,
      status: "pending",
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .onConflictDoNothing()
    .run();

  return friendsState(db, user);
}

async function respondFriendRequest(
  db: Db,
  user: AuthUser,
  rawRequestId: unknown,
  accept: boolean,
): Promise<FriendsState> {
  const requestId = String(rawRequestId ?? "").trim();
  const request = requestId
    ? await db
        .select()
        .from(friendRequestsTable)
        .where(
          and(
            eq(friendRequestsTable.id, requestId),
            eq(friendRequestsTable.toUserId, user.userId),
            eq(friendRequestsTable.status, "pending"),
          ),
        )
        .get()
    : null;

  if (!request) {
    throw new Error("Demande d'ami introuvable.");
  }

  const timestamp = now();
  await db
    .update(friendRequestsTable)
    .set({ status: accept ? "accepted" : "declined", updatedAt: timestamp })
    .where(eq(friendRequestsTable.id, request.id))
    .run();

  if (accept) {
    await db
      .insert(friendshipsTable)
      .values({
        userId: user.userId,
        friendUserId: request.fromUserId,
        createdAt: timestamp,
      })
      .onConflictDoNothing()
      .run();
    await db
      .insert(friendshipsTable)
      .values({
        userId: request.fromUserId,
        friendUserId: user.userId,
        createdAt: timestamp,
      })
      .onConflictDoNothing()
      .run();
  }

  return friendsState(db, user);
}

async function removeFriend(
  db: Db,
  user: AuthUser,
  rawPublicId: unknown,
): Promise<FriendsState> {
  const targetUserId = await resolveFriendTargetUserId(db, rawPublicId);
  if (!targetUserId) {
    throw new Error("Joueur introuvable.");
  }

  await db
    .delete(friendshipsTable)
    .where(
      and(
        eq(friendshipsTable.userId, user.userId),
        eq(friendshipsTable.friendUserId, targetUserId),
      ),
    )
    .run();
  await db
    .delete(friendshipsTable)
    .where(
      and(
        eq(friendshipsTable.userId, targetUserId),
        eq(friendshipsTable.friendUserId, user.userId),
      ),
    )
    .run();

  return friendsState(db, user);
}

const ADMIN_GAMES_LIMIT = 15;

function durationMs(createdAt: string, updatedAt: string): number {
  const start = Date.parse(createdAt);
  const end = Date.parse(updatedAt);
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return 0;
  }
  return Math.max(0, end - start);
}

// L'admin sélectionne un utilisateur via son id d'authentification (better-auth).
// Les parties, elles, sont indexées par l'id Smotu (`google:...` / `auth:...`).
async function smotuUserId(db: Db, authUserId: string): Promise<string | null> {
  const row = await db
    .select({ userId: usersTable.userId })
    .from(usersTable)
    .where(eq(usersTable.authUserId, authUserId))
    .get();
  return row?.userId ?? null;
}

async function adminUserGames(
  db: Db,
  authUserId: string,
): Promise<AdminUserGamesData> {
  const userId = await smotuUserId(db, authUserId);
  if (!userId) {
    return { userId: null, games: [] };
  }

  const [daily, endless, mastermind] = await Promise.all([
    db
      .select()
      .from(dailyGamesTable)
      .where(eq(dailyGamesTable.userId, userId))
      .orderBy(desc(dailyGamesTable.createdAt))
      .limit(ADMIN_GAMES_LIMIT)
      .all(),
    db
      .select()
      .from(endlessGamesTable)
      .where(eq(endlessGamesTable.userId, userId))
      .orderBy(desc(endlessGamesTable.createdAt))
      .limit(ADMIN_GAMES_LIMIT)
      .all(),
    db
      .select()
      .from(mastermindGamesTable)
      .where(eq(mastermindGamesTable.userId, userId))
      .orderBy(desc(mastermindGamesTable.createdAt))
      .limit(ADMIN_GAMES_LIMIT)
      .all(),
  ]);

  const games: AdminUserGame[] = [];

  for (const row of daily) {
    const attempts = parseAttempts(row.attempts);
    const solved = Boolean(row.solved) || attempts.some((a) => a.solved);
    const status: AdminGameStatus = solved
      ? "solved"
      : attempts.length >= MAX_ATTEMPTS
        ? "failed"
        : "active";
    games.push({
      id: row.id,
      mode: "daily",
      answer: getWordForDate(row.dateKey),
      status,
      solved,
      score: row.score,
      attemptCount: attempts.length,
      maxAttempts: MAX_ATTEMPTS,
      durationMs: durationMs(row.createdAt, row.updatedAt),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      attempts,
    });
  }

  for (const row of endless) {
    const attempts = parseAttempts(row.attempts);
    const solved = row.status === "solved" || attempts.some((a) => a.solved);
    const status: AdminGameStatus =
      row.status === "abandoned"
        ? "abandoned"
        : solved
          ? "solved"
          : attempts.length >= MAX_ATTEMPTS || row.status === "failed"
            ? "failed"
            : "active";
    games.push({
      id: row.id,
      mode: "endless",
      answer: row.answer,
      status,
      solved,
      score: row.score,
      attemptCount: attempts.length,
      maxAttempts: MAX_ATTEMPTS,
      durationMs: durationMs(row.createdAt, row.updatedAt),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      attempts,
    });
  }

  for (const row of mastermind) {
    const attempts = parseMastermindAttempts(row.attempts);
    const solved = row.status === "solved" || attempts.some((a) => a.solved);
    const status: AdminGameStatus =
      row.status === "abandoned"
        ? "abandoned"
        : solved
          ? "solved"
          : attempts.length >= MASTERMIND_MAX_ATTEMPTS || row.status === "failed"
            ? "failed"
            : "active";
    games.push({
      id: row.id,
      mode: "mastermind",
      answer: row.answer,
      answerColors: normalizeMastermindGuess(row.answer),
      status,
      solved,
      score: row.score,
      attemptCount: attempts.length,
      maxAttempts: MASTERMIND_MAX_ATTEMPTS,
      durationMs: durationMs(row.createdAt, row.updatedAt),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      attempts: [],
      mastermindAttempts: attempts,
    });
  }

  games.sort((left, right) =>
    left.createdAt < right.createdAt
      ? 1
      : left.createdAt > right.createdAt
        ? -1
        : 0,
  );

  return { userId, games: games.slice(0, ADMIN_GAMES_LIMIT) };
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

// Le panel admin liste les comptes better-auth, dont le `name` vient de Google.
// On récupère ici le pseudo Smotu choisi par l'utilisateur (table `users`,
// rattachée via `authUserId`) pour l'afficher à la place du nom Google.
async function adminUsernames(
  db: Db,
  authUserIds: string[],
): Promise<Record<string, string>> {
  const ids = authUserIds.filter(Boolean);
  if (ids.length === 0) {
    return {};
  }

  const rows = await db
    .select({
      authUserId: usersTable.authUserId,
      username: usersTable.username,
    })
    .from(usersTable)
    .where(inArray(usersTable.authUserId, ids))
    .all();

  const names: Record<string, string> = {};
  for (const row of rows) {
    if (row.authUserId && row.username) {
      names[row.authUserId] = row.username;
    }
  }
  return names;
}

function normalizeShopItemId(value: unknown): ShopItemId | undefined {
  return shopItemById(value)?.id;
}

function normalizeShopSlot(value: unknown): ShopEquipSlot | undefined {
  const slot = String(value ?? "");
  return ["avatar", "hat", "shirt", "confetti", "theme"].includes(slot)
    ? (slot as ShopEquipSlot)
    : undefined;
}

type ShopPurchaseRow = {
  id: string;
  itemId: string;
  quantity: number;
  spent: number;
  createdAt: string;
};

type ShopEquipmentRow = {
  slot: string;
  itemId: string;
};

async function shopPurchaseRows(
  db: Db,
  userId: string,
): Promise<ShopPurchaseRow[]> {
  return db
    .select({
      id: shopPurchasesTable.id,
      itemId: shopPurchasesTable.itemId,
      quantity: shopPurchasesTable.quantity,
      spent: shopPurchasesTable.spent,
      createdAt: shopPurchasesTable.createdAt,
    })
    .from(shopPurchasesTable)
    .where(eq(shopPurchasesTable.userId, userId))
    .orderBy(desc(shopPurchasesTable.createdAt))
    .all();
}

async function shopEquipmentRows(
  db: Db,
  userId: string,
): Promise<ShopEquipmentRow[]> {
  return db
    .select({
      slot: shopEquipmentTable.slot,
      itemId: shopEquipmentTable.itemId,
    })
    .from(shopEquipmentTable)
    .where(eq(shopEquipmentTable.userId, userId))
    .all();
}

function ownedItemIdsFromPurchases(purchases: ShopPurchaseRow[]): ShopItemId[] {
  return Array.from(
    new Set([
      ...defaultOwnedItemIds(),
      ...purchases
        .map((row) => normalizeShopItemId(row.itemId))
        .filter((itemId): itemId is ShopItemId => Boolean(itemId)),
    ]),
  );
}

function ownedByCategory(ownedItemIds: ShopItemId[]): Record<ShopCategory, ShopItemId[]> {
  const byCategory: Record<ShopCategory, ShopItemId[]> = {
    avatar: [],
    hat: [],
    shirt: [],
    confetti: [],
    theme: [],
    hint: [],
  };

  for (const itemId of ownedItemIds) {
    const item = shopItemById(itemId);
    if (item) {
      byCategory[item.category].push(item.id);
    }
  }

  return byCategory;
}

function equipmentFromRows(
  rows: ShopEquipmentRow[],
  ownedItemIds: ShopItemId[],
  purchases: ShopPurchaseRow[] = [],
): ShopEquipment {
  const owned = new Set(ownedItemIds);
  const equipped: ShopEquipment = { ...DEFAULT_SHOP_EQUIPMENT };
  const explicitSlots = new Set<ShopEquipSlot>();

  for (const row of rows) {
    const slot = normalizeShopSlot(row.slot);
    const itemId = normalizeShopItemId(row.itemId);
    const item = itemId ? shopItemById(itemId) : undefined;
    if (slot && item && item.slot === slot && owned.has(item.id)) {
      equipped[slot] = item.id;
      explicitSlots.add(slot);
    }
  }

  for (const row of purchases) {
    const itemId = normalizeShopItemId(row.itemId);
    const item = itemId ? shopItemById(itemId) : undefined;
    if (item?.slot && !explicitSlots.has(item.slot) && owned.has(item.id)) {
      equipped[item.slot] = item.id;
      explicitSlots.add(item.slot);
    }
  }

  return equipped;
}

function hintCounts(purchases: { itemId: string; quantity: number }[]) {
  let hintLetterCount = 0;
  let hintPositionCount = 0;
  let hintMastermindCount = 0;

  for (const purchase of purchases) {
    if (purchase.itemId === "hint-letter-pack") {
      hintLetterCount += purchase.quantity * 3;
    }
    if (purchase.itemId === "hint-position-pack") {
      hintPositionCount += purchase.quantity * 2;
    }
    if (purchase.itemId === "hint-mastermind-pack") {
      hintMastermindCount += purchase.quantity * 2;
    }
  }

  return { hintLetterCount, hintPositionCount, hintMastermindCount };
}

async function shopInventory(db: Db, user: AuthUser): Promise<ShopInventory> {
  const stats = await profileStats(db, user);
  const [rows, equipmentRows] = await Promise.all([
    shopPurchaseRows(db, user.userId),
    shopEquipmentRows(db, user.userId),
  ]);
  // Remboursement auto des items retirés du catalogue (ex. contours) : on ne compte
  // dans les dépenses que les achats dont l'itemId est encore valide, les smotucoins
  // dépensés sur des items supprimés reviennent donc automatiquement dans la balance.
  const lifetimeSpent = rows.reduce(
    (total, row) => (normalizeShopItemId(row.itemId) ? total + row.spent : total),
    0,
  );
  // La monnaie (smotucoin) est créditée en récompenses fixes par victoire : le
  // classement garde ses points pleins, les deux systèmes sont découplés.
  const lifetimeEarned = smotucoinsEarned(
    stats.dailySolved,
    stats.endlessSolved,
    stats.mastermindSolved,
  );
  const ownedItemIds = ownedItemIdsFromPurchases(rows);
  const equipped = equipmentFromRows(equipmentRows, ownedItemIds, rows);
  const consumables = hintCounts(rows);

  return {
    balance: Math.max(0, lifetimeEarned - lifetimeSpent),
    lifetimeEarned,
    lifetimeSpent,
    purchases: rows.flatMap((row) => {
      const itemId = normalizeShopItemId(row.itemId);
      return itemId
        ? [
            {
              id: row.id,
              itemId,
              quantity: row.quantity,
              spent: row.spent,
              createdAt: row.createdAt,
            },
          ]
        : [];
    }),
    ownedItemIds,
    ownedByCategory: ownedByCategory(ownedItemIds),
    equipped,
    publicAvatar: publicAvatarFromEquipment(equipped),
    consumables: {
      hintLetter: consumables.hintLetterCount,
      hintPosition: consumables.hintPositionCount,
      hintMastermind: consumables.hintMastermindCount,
    },
    ...consumables,
  };
}

async function shopState(db: Db, user: AuthUser): Promise<ShopState> {
  return {
    sections: SHOP_SECTIONS,
    items: SHOP_ITEMS,
    inventory: await shopInventory(db, user),
  };
}

async function setShopEquipment(
  db: Db,
  userId: string,
  slot: ShopEquipSlot,
  itemId: ShopItemId,
): Promise<void> {
  await db
    .insert(shopEquipmentTable)
    .values({
      userId,
      slot,
      itemId,
      updatedAt: now(),
    })
    .onConflictDoUpdate({
      target: [shopEquipmentTable.userId, shopEquipmentTable.slot],
      set: { itemId, updatedAt: now() },
    })
    .run();
}

async function buyShopItem(
  db: Db,
  user: AuthUser,
  rawItemId: unknown,
): Promise<ShopState> {
  const itemId = normalizeShopItemId(rawItemId);
  const item = SHOP_ITEMS.find((candidate) => candidate.id === itemId);

  if (!item) {
    throw new Error("Article boutique introuvable.");
  }

  const inventory = await shopInventory(db, user);
  if (!item.repeatable && inventory.ownedItemIds.includes(item.id)) {
    throw new Error("Cet article est déjà dans ton inventaire.");
  }
  if (inventory.balance < item.price) {
    throw new Error("Solde de smotucoins insuffisant.");
  }

  await db
    .insert(shopPurchasesTable)
    .values({
      id: crypto.randomUUID(),
      userId: user.userId,
      itemId: item.id,
      quantity: 1,
      spent: item.price,
      createdAt: now(),
    })
    .run();

  if (item.slot) {
    await setShopEquipment(db, user.userId, item.slot, item.id);
  }

  return shopState(db, user);
}

async function equipShopItem(
  db: Db,
  user: AuthUser,
  rawItemId: unknown,
  rawSlot: unknown,
): Promise<ShopState> {
  const itemId = normalizeShopItemId(rawItemId);
  const item = itemId ? shopItemById(itemId) : undefined;
  const slot = normalizeShopSlot(rawSlot) ?? item?.slot;

  if (!item || !itemId || !slot || item.slot !== slot) {
    throw new Error("Cosmétique impossible à équiper.");
  }
  if (item.category === "hint") {
    throw new Error("Les indices ne peuvent pas être équipés.");
  }

  const inventory = await shopInventory(db, user);
  if (!inventory.ownedItemIds.includes(itemId)) {
    throw new Error("Tu dois acheter cet article avant de l'équiper.");
  }

  await setShopEquipment(db, user.userId, slot, itemId);
  return shopState(db, user);
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

  if (request.method === "GET" && url.pathname === "/api/admin/usernames") {
    await requireAdmin(request, env, db);
    const ids = (url.searchParams.get("ids") ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    return json({ names: await adminUsernames(db, ids) });
  }

  if (request.method === "GET" && url.pathname === "/api/admin/user-games") {
    await requireAdmin(request, env, db);
    const targetId = url.searchParams.get("userId")?.trim() ?? "";
    if (!targetId) {
      return error("userId requis.", 400);
    }
    return json(await adminUserGames(db, targetId));
  }

  const user = await requireUser(request, env);
  await ensureUserProfile(db, user);

  if (request.method === "GET" && url.pathname === "/api/session") {
    return json({ user });
  }

  if (request.method === "GET" && url.pathname === "/api/profile") {
    return json(await profileStats(db, user));
  }

  if (request.method === "GET" && url.pathname === "/api/profile/games") {
    // `Number(null)` et `Number("")` valent 0 : absent/vide/invalide => défaut 60.
    const requested = Number(url.searchParams.get("limit"));
    const limit =
      Number.isFinite(requested) && requested >= 1
        ? Math.min(200, Math.floor(requested))
        : 60;
    return json(await profileRecentGames(db, user.userId, limit));
  }

  if (request.method === "POST" && url.pathname === "/api/profile/username") {
    const body = await requestBody(request);
    return json(await setUsername(db, user, String(body.username ?? "")));
  }

  if (request.method === "GET" && url.pathname === "/api/players/search") {
    return json(await playerSearch(db, user, url.searchParams.get("q") ?? ""));
  }

  if (request.method === "GET" && url.pathname.startsWith("/api/players/")) {
    const publicId = decodeURIComponent(url.pathname.slice("/api/players/".length));
    return json(await publicPlayerProfile(db, user, publicId));
  }

  if (request.method === "GET" && url.pathname === "/api/friends") {
    return json(await friendsState(db, user));
  }

  if (request.method === "POST" && url.pathname === "/api/friends/request") {
    const body = await requestBody(request);
    return json(await requestFriend(db, user, body.targetUserId ?? body.username));
  }

  if (request.method === "POST" && url.pathname === "/api/friends/respond") {
    const body = await requestBody(request);
    return json(await respondFriendRequest(db, user, body.requestId, Boolean(body.accept)));
  }

  if (request.method === "POST" && url.pathname === "/api/friends/remove") {
    const body = await requestBody(request);
    return json(await removeFriend(db, user, body.targetUserId));
  }

  if (request.method === "GET" && url.pathname === "/api/shop") {
    return json(await shopState(db, user));
  }

  if (request.method === "POST" && url.pathname === "/api/shop/buy") {
    const body = await requestBody(request);
    return json(await buyShopItem(db, user, body.itemId));
  }

  if (request.method === "POST" && url.pathname === "/api/shop/equip") {
    const body = await requestBody(request);
    return json(await equipShopItem(db, user, body.itemId, body.slot));
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
