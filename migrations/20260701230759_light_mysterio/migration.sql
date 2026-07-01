CREATE TABLE IF NOT EXISTS `attempts` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`user_name` text NOT NULL,
	`date_key` text NOT NULL,
	`guess` text NOT NULL,
	`pattern` text NOT NULL,
	`attempt_number` integer NOT NULL,
	`solved` integer DEFAULT 0 NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `endless_attempts` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`user_name` text NOT NULL,
	`game_id` text NOT NULL,
	`guess` text NOT NULL,
	`pattern` text NOT NULL,
	`attempt_number` integer NOT NULL,
	`solved` integer DEFAULT 0 NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `endless_games` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`user_name` text NOT NULL,
	`answer` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `attempts_user_date_idx` ON `attempts` (`user_id`,`date_key`,`created_at`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `attempts_date_solved_idx` ON `attempts` (`date_key`,`solved`,`created_at`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `endless_attempts_game_idx` ON `endless_attempts` (`game_id`,`created_at`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `endless_attempts_solved_idx` ON `endless_attempts` (`solved`,`created_at`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `endless_games_user_status_idx` ON `endless_games` (`user_id`,`status`,`created_at`);
