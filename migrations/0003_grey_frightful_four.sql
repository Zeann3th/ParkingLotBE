CREATE TABLE `parking_history` (
	`id` text PRIMARY KEY NOT NULL,
	`slot_id` text NOT NULL,
	`vehicle_number` text NOT NULL,
	`vehicle_type` text NOT NULL,
	`checked_in_at` text NOT NULL,
	`checked_out_at` text,
	`fee` integer,
	`payment_status` text,
	`notes` text,
	FOREIGN KEY (`slot_id`) REFERENCES `parking_slots`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `parking_floors` ADD `capacity` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `parking_slots` DROP COLUMN `vehicle_number`;--> statement-breakpoint
ALTER TABLE `parking_slots` DROP COLUMN `vehicle_type`;