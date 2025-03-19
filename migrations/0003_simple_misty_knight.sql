PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_ticket_prices` (
	`type` text NOT NULL,
	`vehicle_type` text NOT NULL,
	`price` real NOT NULL,
	PRIMARY KEY(`type`, `vehicle_type`)
);
--> statement-breakpoint
INSERT INTO `__new_ticket_prices`("type", "vehicle_type", "price") SELECT "type", "vehicle_type", "price" FROM `ticket_prices`;--> statement-breakpoint
DROP TABLE `ticket_prices`;--> statement-breakpoint
ALTER TABLE `__new_ticket_prices` RENAME TO `ticket_prices`;--> statement-breakpoint
PRAGMA foreign_keys=ON;