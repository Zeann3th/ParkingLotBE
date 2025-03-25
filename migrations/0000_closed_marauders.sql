CREATE TABLE `history` (
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
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`from` integer NOT NULL,
	`to` integer NOT NULL,
	`message` text NOT NULL,
	`status` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`from`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `to_idx` ON `notifications` (`to`);--> statement-breakpoint
CREATE TABLE `residence_vehicles` (
	`residence_id` integer NOT NULL,
	`vehicle_id` integer NOT NULL,
	PRIMARY KEY(`vehicle_id`, `residence_id`),
	FOREIGN KEY (`residence_id`) REFERENCES `residences`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `residences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`building` text NOT NULL,
	`room` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`capacity` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sections_name_unique` ON `sections` (`name`);--> statement-breakpoint
CREATE TABLE `ticket_prices` (
	`type` text NOT NULL,
	`vehicle_type` text NOT NULL,
	`price` real NOT NULL,
	PRIMARY KEY(`type`, `vehicle_type`)
);
--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_privileges` (
	`user_id` integer NOT NULL,
	`section_id` integer NOT NULL,
	PRIMARY KEY(`user_id`, `section_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_residences` (
	`user_id` integer NOT NULL,
	`residence_id` integer NOT NULL,
	PRIMARY KEY(`user_id`, `residence_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`residence_id`) REFERENCES `residences`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_tickets` (
	`user_id` integer NOT NULL,
	`ticket_id` integer NOT NULL,
	`vehicle_id` integer NOT NULL,
	PRIMARY KEY(`user_id`, `ticket_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`name` text NOT NULL,
	`password` text NOT NULL,
	`role` text NOT NULL,
	`refresh_token` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE TABLE `vehicle_reservations` (
	`ticket_id` integer NOT NULL,
	`section_id` integer NOT NULL,
	`slot` integer NOT NULL,
	PRIMARY KEY(`section_id`, `slot`),
	FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plate` text NOT NULL,
	`type` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vehicles_plate_unique` ON `vehicles` (`plate`);