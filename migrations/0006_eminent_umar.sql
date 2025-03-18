DROP TABLE `whitelisted_vehicles`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_parking_history` (
	`id` text PRIMARY KEY NOT NULL,
	`slot_id` integer NOT NULL,
	`vehicle_id` integer NOT NULL,
	`checked_in_at` text NOT NULL,
	`checked_out_at` text,
	`ticket_id` integer,
	`payment_status` text NOT NULL,
	FOREIGN KEY (`slot_id`) REFERENCES `parking_slots`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_parking_history`("id", "slot_id", "vehicle_id", "checked_in_at", "checked_out_at", "ticket_id", "payment_status") SELECT "id", "slot_id", "vehicle_id", "checked_in_at", "checked_out_at", "ticket_id", "payment_status" FROM `parking_history`;--> statement-breakpoint
DROP TABLE `parking_history`;--> statement-breakpoint
ALTER TABLE `__new_parking_history` RENAME TO `parking_history`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `parking_slots` ADD `vehicle_id` integer REFERENCES vehicles(id);