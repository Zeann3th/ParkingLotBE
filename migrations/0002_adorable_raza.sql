PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_history` (
	`id` text PRIMARY KEY NOT NULL,
	`section_id` integer NOT NULL,
	`vehicle_id` integer NOT NULL,
	`checked_in_at` text NOT NULL,
	`checked_out_at` text,
	`ticket_id` integer,
	`fee` real,
	FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_history`("id", "section_id", "vehicle_id", "checked_in_at", "checked_out_at", "ticket_id", "fee") SELECT "id", "section_id", "vehicle_id", "checked_in_at", "checked_out_at", "ticket_id", "fee" FROM `history`;--> statement-breakpoint
DROP TABLE `history`;--> statement-breakpoint
ALTER TABLE `__new_history` RENAME TO `history`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_vehicle_reservations` (
	`ticket_id` integer NOT NULL,
	`vehicle_id` integer NOT NULL,
	`section_id` integer NOT NULL,
	`slot` integer NOT NULL,
	PRIMARY KEY(`slot`, `section_id`, `ticket_id`, `vehicle_id`),
	FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_vehicle_reservations`("ticket_id", "vehicle_id", "section_id", "slot") SELECT "ticket_id", "vehicle_id", "section_id", "slot" FROM `vehicle_reservations`;--> statement-breakpoint
DROP TABLE `vehicle_reservations`;--> statement-breakpoint
ALTER TABLE `__new_vehicle_reservations` RENAME TO `vehicle_reservations`;--> statement-breakpoint
ALTER TABLE `users` ADD `name` text NOT NULL;