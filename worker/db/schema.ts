import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { EndlessGameStatus, MastermindGameStatus } from "../../shared/game";

export const users = sqliteTable("users", {
  userId: text("user_id").primaryKey(),
  username: text("username").notNull(),
  authUserId: text("auth_user_id"),
  googleAccountId: text("google_account_id"),
  email: text("email"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const attempts = sqliteTable(
  "attempts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    userName: text("user_name").notNull(),
    dateKey: text("date_key").notNull(),
    guess: text("guess").notNull(),
    pattern: text("pattern").notNull(),
    attemptNumber: integer("attempt_number").notNull(),
    solved: integer("solved").notNull().default(0),
    score: integer("score").notNull().default(0),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("attempts_user_date_idx").on(
      table.userId,
      table.dateKey,
      table.createdAt,
    ),
    index("attempts_date_solved_idx").on(
      table.dateKey,
      table.solved,
      table.createdAt,
    ),
  ],
);

export const endlessGames = sqliteTable(
  "endless_games",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    userName: text("user_name").notNull(),
    answer: text("answer").notNull(),
    status: text("status").$type<EndlessGameStatus>().notNull().default("active"),
    score: integer("score").notNull().default(0),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("endless_games_user_status_idx").on(
      table.userId,
      table.status,
      table.createdAt,
    ),
  ],
);

export const endlessAttempts = sqliteTable(
  "endless_attempts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    userName: text("user_name").notNull(),
    gameId: text("game_id").notNull(),
    guess: text("guess").notNull(),
    pattern: text("pattern").notNull(),
    attemptNumber: integer("attempt_number").notNull(),
    solved: integer("solved").notNull().default(0),
    score: integer("score").notNull().default(0),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("endless_attempts_game_idx").on(table.gameId, table.createdAt),
    index("endless_attempts_solved_idx").on(table.solved, table.createdAt),
  ],
);

export const mastermindGames = sqliteTable(
  "mastermind_games",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    userName: text("user_name").notNull(),
    answer: text("answer").notNull(),
    status: text("status")
      .$type<MastermindGameStatus>()
      .notNull()
      .default("active"),
    score: integer("score").notNull().default(0),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("mastermind_games_user_status_idx").on(
      table.userId,
      table.status,
      table.createdAt,
    ),
  ],
);

export const mastermindAttempts = sqliteTable(
  "mastermind_attempts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    userName: text("user_name").notNull(),
    gameId: text("game_id").notNull(),
    guess: text("guess").notNull(),
    exactCount: integer("exact_count").notNull().default(0),
    presentCount: integer("present_count").notNull().default(0),
    attemptNumber: integer("attempt_number").notNull(),
    solved: integer("solved").notNull().default(0),
    score: integer("score").notNull().default(0),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("mastermind_attempts_game_idx").on(table.gameId, table.createdAt),
    index("mastermind_attempts_solved_idx").on(table.solved, table.createdAt),
  ],
);

export type StoredUser = typeof users.$inferSelect;
export type StoredAttempt = typeof attempts.$inferSelect;
export type StoredEndlessGame = typeof endlessGames.$inferSelect;
export type StoredEndlessAttempt = typeof endlessAttempts.$inferSelect;
export type StoredMastermindGame = typeof mastermindGames.$inferSelect;
export type StoredMastermindAttempt = typeof mastermindAttempts.$inferSelect;
