CREATE TABLE `vehicle_reservations` (
	`ticket_id` integer NOT NULL,
	`vehicle_id` integer NOT NULL,
	`section_id` integer NOT NULL,
	`slot` integer NOT NULL,
	PRIMARY KEY(`vehicle_id`, `section_id`, `ticket_id`),
	FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `history` ADD `section_id` integer NOT NULL REFERENCES sections(id);--> statement-breakpoint
ALTER TABLE `vehicles` DROP COLUMN `reserved_slot`;