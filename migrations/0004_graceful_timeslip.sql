DROP INDEX "users_username_unique";--> statement-breakpoint
ALTER TABLE `parking_history` ALTER COLUMN "payment_status" TO "payment_status" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);