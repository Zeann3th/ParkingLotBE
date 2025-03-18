PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_whitelisted_vehicles` (
	`vehicle_id` integer PRIMARY KEY NOT NULL,
	`slot_id` integer NOT NULL,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`slot_id`) REFERENCES `parking_slots`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_whitelisted_vehicles`("vehicle_id", "slot_id") SELECT "vehicle_id", "slot_id" FROM `whitelisted_vehicles`;--> statement-breakpoint
DROP TABLE `whitelisted_vehicles`;--> statement-breakpoint
ALTER TABLE `__new_whitelisted_vehicles` RENAME TO `whitelisted_vehicles`;--> statement-breakpoint
PRAGMA foreign_keys=ON;