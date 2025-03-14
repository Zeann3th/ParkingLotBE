CREATE TABLE `parking_slots` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`status` text NOT NULL,
	`vehicle_number` text,
	`vehicle_type` text,
	`floor_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`floor_id`) REFERENCES `parking_floors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_privileges` (
	`user_id` text NOT NULL,
	`section_id` text NOT NULL,
	PRIMARY KEY(`user_id`, `section_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`section_id`) REFERENCES `parking_sections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `parking_floors` ALTER COLUMN "section_id" TO "section_id" text NOT NULL REFERENCES parking_sections(id) ON DELETE cascade ON UPDATE no action;