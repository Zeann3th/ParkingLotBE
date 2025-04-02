CREATE TABLE `transactions` (
	`user_id` integer NOT NULL,
	`amount` real NOT NULL,
	`month` integer NOT NULL,
	`year` integer NOT NULL,
	`status` text NOT NULL,
	PRIMARY KEY(`user_id`, `month`, `year`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_residence_idx` ON `residences` (`building`,`room`);
