ALTER TABLE `vehicles` RENAME COLUMN "vehicle_number" TO "plate";--> statement-breakpoint
ALTER TABLE `vehicles` RENAME COLUMN "vehicle_type" TO "type";--> statement-breakpoint
DROP INDEX `vehicles_vehicle_number_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `vehicles_plate_unique` ON `vehicles` (`plate`);