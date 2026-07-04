ALTER TABLE `user` ADD COLUMN `role` text DEFAULT 'user';
--> statement-breakpoint
ALTER TABLE `user` ADD COLUMN `banned` integer DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `user` ADD COLUMN `banReason` text;
--> statement-breakpoint
ALTER TABLE `user` ADD COLUMN `banExpires` integer;
--> statement-breakpoint
ALTER TABLE `session` ADD COLUMN `impersonatedBy` text;
