CREATE TABLE `parking_history` (
	`id` text PRIMARY KEY NOT NULL,
	`slot_id` integer NOT NULL,
	`vehicle_number` text NOT NULL,
	`vehicle_type` text NOT NULL,
	`checked_in_at` text NOT NULL,
	`checked_out_at` text,
	`ticket_id` integer,
	`payment_status` text NOT NULL,
	FOREIGN KEY (`slot_id`) REFERENCES `parking_slots`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `parking_sections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`capacity` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `parking_slots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`status` text NOT NULL,
	`section_id` integer NOT NULL,
	FOREIGN KEY (`section_id`) REFERENCES `parking_sections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vehicle_number` text NOT NULL,
	`ticket_type` text NOT NULL,
	`status` text NOT NULL,
	`price` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_privileges` (
	`user_id` integer NOT NULL,
	`section_id` integer NOT NULL,
	PRIMARY KEY(`user_id`, `section_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`section_id`) REFERENCES `parking_sections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`role` text NOT NULL,
	`refresh_token` text,
	`is_authenticated` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE TABLE `whitelisted_vehicles` (
	`vehicle_number` text NOT NULL,
	`slot_id` integer NOT NULL,
	PRIMARY KEY(`vehicle_number`, `slot_id`),
	FOREIGN KEY (`slot_id`) REFERENCES `parking_slots`(`id`) ON UPDATE no action ON DELETE cascade
);
