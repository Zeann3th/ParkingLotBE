CREATE TABLE `vehicles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vehicle_number` text NOT NULL,
	`vehicle_type` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vehicles_vehicle_number_unique` ON `vehicles` (`vehicle_number`);--> statement-breakpoint
DROP INDEX `parking_slots_name_unique`;--> statement-breakpoint
ALTER TABLE `parking_slots` DROP COLUMN `name`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_whitelisted_vehicles` (
	`vehicle_id` integer NOT NULL,
	`slot_id` integer NOT NULL,
	PRIMARY KEY(`vehicle_id`, `slot_id`),
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`slot_id`) REFERENCES `parking_slots`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_whitelisted_vehicles`("vehicle_id", "slot_id") SELECT "vehicle_id", "slot_id" FROM `whitelisted_vehicles`;--> statement-breakpoint
DROP TABLE `whitelisted_vehicles`;--> statement-breakpoint
ALTER TABLE `__new_whitelisted_vehicles` RENAME TO `whitelisted_vehicles`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `parking_history` ADD `vehicle_id` integer NOT NULL REFERENCES vehicles(id);--> statement-breakpoint
ALTER TABLE `parking_history` DROP COLUMN `vehicle_number`;--> statement-breakpoint
ALTER TABLE `parking_history` DROP COLUMN `vehicle_type`;