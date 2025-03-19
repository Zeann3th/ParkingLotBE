PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_ticket_prices` (
	`type` text NOT NULL,
	`vehicle_type` text NOT NULL,
	`price` real NOT NULL,
	`period` integer NOT NULL,
	PRIMARY KEY(`type`, `period`)
);
--> statement-breakpoint
INSERT INTO `__new_ticket_prices`("type", "vehicle_type", "price", "period") SELECT "type", "vehicle_type", "price", "period" FROM `ticket_prices`;--> statement-breakpoint
DROP TABLE `ticket_prices`;--> statement-breakpoint
ALTER TABLE `__new_ticket_prices` RENAME TO `ticket_prices`;--> statement-breakpoint
PRAGMA foreign_keys=ON;