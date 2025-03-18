ALTER TABLE `tickets` ADD `valid_from` text NOT NULL;--> statement-breakpoint
ALTER TABLE `tickets` ADD `valid_to` text NOT NULL;--> statement-breakpoint
ALTER TABLE `tickets` DROP COLUMN `vehicle_number`;