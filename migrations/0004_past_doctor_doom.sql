PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_vehicle_reservations` (
	`ticket_id` integer NOT NULL,
	`vehicle_id` integer NOT NULL,
	`section_id` integer NOT NULL,
	`slot` integer NOT NULL,
	PRIMARY KEY(`section_id`, `slot`),
	FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_vehicle_reservations`("ticket_id", "vehicle_id", "section_id", "slot") SELECT "ticket_id", "vehicle_id", "section_id", "slot" FROM `vehicle_reservations`;--> statement-breakpoint
DROP TABLE `vehicle_reservations`;--> statement-breakpoint
ALTER TABLE `__new_vehicle_reservations` RENAME TO `vehicle_reservations`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `to_idx` ON `notifications` (`to`);