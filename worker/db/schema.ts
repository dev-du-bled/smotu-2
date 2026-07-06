import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import type { EndlessGameStatus, MastermindGameStatus } from "../../shared/game";

export const users = sqliteTable("users", {
  userId: text("user_id").primaryKey(),
  username: text("username").notNull(),
  authUserId: text("auth_user_id"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Une partie = une seule ligne. Les coups sont sérialisés en JSON dans la colonne
// `attempts`, plutôt que dans une table dédiée (une ligne par coup), pour éviter
// que le mode libre / mastermind (spammables) ne fassent gonfler la base.

export const dailyGames = sqliteTable(
  "daily_games",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    userName: text("user_name").notNull(),
    dateKey: text("date_key").notNull(),
    attempts: text("attempts").notNull().default("[]"),
    solved: integer("solved").notNull().default(0),
    score: integer("score").notNull().default(0),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("daily_games_user_date_idx").on(table.userId, table.dateKey),
    index("daily_games_solved_idx").on(table.solved, table.createdAt),
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
    attempts: text("attempts").notNull().default("[]"),
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

export const shopPurchases = sqliteTable(
  "shop_purchases",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    itemId: text("item_id").notNull(),
    quantity: integer("quantity").notNull().default(1),
    spent: integer("spent").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("shop_purchases_user_idx").on(table.userId, table.createdAt)],
);

export const shopEquipment = sqliteTable(
  "shop_equipment",
  {
    userId: text("user_id").notNull(),
    slot: text("slot").notNull(),
    itemId: text("item_id").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("shop_equipment_user_slot_idx").on(table.userId, table.slot),
  ],
);

export const friendships = sqliteTable(
  "friendships",
  {
    userId: text("user_id").notNull(),
    friendUserId: text("friend_user_id").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("friendships_user_friend_idx").on(
      table.userId,
      table.friendUserId,
    ),
  ],
);

export const friendRequests = sqliteTable(
  "friend_requests",
  {
    id: text("id").primaryKey(),
    fromUserId: text("from_user_id").notNull(),
    toUserId: text("to_user_id").notNull(),
    status: text("status").notNull().default("pending"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("friend_requests_pair_pending_idx").on(
      table.fromUserId,
      table.toUserId,
      table.status,
    ),
    index("friend_requests_to_status_idx").on(table.toUserId, table.status),
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
    attempts: text("attempts").notNull().default("[]"),
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

export type StoredShopPurchase = typeof shopPurchases.$inferSelect;
export type StoredShopEquipment = typeof shopEquipment.$inferSelect;
export type StoredFriendship = typeof friendships.$inferSelect;
export type StoredFriendRequest = typeof friendRequests.$inferSelect;
export type StoredUser = typeof users.$inferSelect;
export type StoredDailyGame = typeof dailyGames.$inferSelect;
export type StoredEndlessGame = typeof endlessGames.$inferSelect;
export type StoredMastermindGame = typeof mastermindGames.$inferSelect;
