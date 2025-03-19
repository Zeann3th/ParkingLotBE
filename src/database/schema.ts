import { unique } from "drizzle-orm/gel-core";
import { integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer().primaryKey({ autoIncrement: true }),
  username: text().unique().notNull(),
  password: text().notNull(),
  role: text({ enum: ["ADMIN", "USER"] }).$default(() => "USER").notNull(),
  refreshToken: text("refresh_token"),
  createdAt: text("created_at").$default(() => new Date().toISOString()).notNull(),
  updatedAt: text("updated_at").$default(() => new Date().toISOString()).notNull(),
});

export type UserRole = "ADMIN" | "USER";

export const sections = sqliteTable("parking_sections", {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().unique().notNull(),
  capacity: integer().notNull(),
});

export const userPrivileges = sqliteTable("user_privileges", {
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sectionId: integer("section_id").notNull().references(() => sections.id, { onDelete: "cascade" }),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.sectionId] })
  };
});

export const vehicles = sqliteTable("vehicles", {
  id: integer().primaryKey({ autoIncrement: true }),
  plate: text().unique().notNull(),
  type: text({ enum: ["CAR", "MOTORBIKE"] }).notNull(),
});

export type VehicleType = "CAR" | "MOTORBIKE";

export const slots = sqliteTable("parking_slots", {
  id: integer().primaryKey({ autoIncrement: true }),
  status: text({ enum: ["FREE", "OCCUPIED"] }).$default(() => "FREE").notNull(),
  sectionId: integer("section_id").notNull().references(() => sections.id, { onDelete: "cascade" }),
  vehicleId: integer("vehicle_id").references(() => vehicles.id)
});

export type SlotStatus = "FREE" | "OCCUPIED";

export const tickets = sqliteTable("tickets", {
  id: integer().primaryKey({ autoIncrement: true }),
  type: text("type", { enum: ["MONTHLY", "DAILY"] }).notNull(),
  status: text("status", { enum: ["AVAILABLE", "INUSE", "LOST"] }).$default(() => "AVAILABLE").notNull(),
  validFrom: text("valid_from").$default(() => new Date().toISOString()).notNull(),
  validTo: text("valid_to").notNull(),
});

export type TicketType = "MONTHLY" | "DAILY";

export type TicketStatus = "AVAILABLE" | "INUSE" | "LOST";

export const ticketPrices = sqliteTable("ticket_prices", {
  type: text("type", { enum: ["MONTHLY", "DAILY"] }).notNull(),
  vehicleType: text("vehicle_type", { enum: ["CAR", "MOTORBIKE"] }).notNull(),
  price: real().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.type, table.vehicleType] })
}));

export const parkingHistory = sqliteTable("parking_history", {
  id: text().primaryKey().$default(() => crypto.randomUUID()),
  slotId: integer("slot_id").notNull().references(() => slots.id, { onDelete: "set null" }),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "set null" }),
  checkedInAt: text("checked_in_at").$default(() => new Date().toISOString()).notNull(),
  checkedOutAt: text("checked_out_at"),
  ticketId: integer("ticket_id").references(() => tickets.id, { onDelete: "set null" }),
  paymentStatus: text("payment_status", { enum: ["PENDING", "PAID"] }).$default(() => "PENDING").notNull(),
});
