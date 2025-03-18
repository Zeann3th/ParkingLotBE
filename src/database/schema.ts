import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer().primaryKey({ autoIncrement: true }),
  username: text().unique().notNull(),
  password: text().notNull(),
  role: text({ enum: ["ADMIN", "USER"] }).$default(() => "USER").notNull(),
  refreshToken: text("refresh_token"),
  isAuthenticated: integer("is_authenticated").$default(() => 0).notNull(),
  createdAt: text("created_at").$default(() => new Date().toISOString()).notNull(),
  updatedAt: text("updated_at").$default(() => new Date().toISOString()).notNull(),
});

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

export const slots = sqliteTable("parking_slots", {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().unique().notNull(),
  status: text({ enum: ["FREE", "OCCUPIED"] }).$default(() => "FREE").notNull(),
  sectionId: integer("section_id").notNull().references(() => sections.id, { onDelete: "cascade" }),
});

export const tickets = sqliteTable("tickets", {
  id: integer().primaryKey({ autoIncrement: true }),
  ticketType: text("ticket_type", { enum: ["MONTHLY", "DAILY"] }).notNull(),
  status: text("status", { enum: ["AVAILABLE", "INUSE", "LOST"] }).$default(() => "AVAILABLE").notNull(),
  validFrom: text("valid_from").$default(() => new Date().toISOString()).notNull(),
  validTo: text("valid_to").notNull(),
  price: integer().notNull(),
});

export const parkingHistory = sqliteTable("parking_history", {
  id: text().primaryKey().$default(() => crypto.randomUUID()),
  slotId: integer("slot_id").notNull().references(() => slots.id, { onDelete: "cascade" }),
  vehicleNumber: text("vehicle_number").notNull(),
  vehicleType: text("vehicle_type", { enum: ["CAR", "MOTORBIKE"] }).notNull(),
  checkedInAt: text("checked_in_at").$default(() => new Date().toISOString()).notNull(),
  checkedOutAt: text("checked_out_at"),
  ticketId: integer("ticket_id").references(() => tickets.id),
  paymentStatus: text("payment_status", { enum: ["PENDING", "PAID"] }).$default(() => "PENDING").notNull(),
});

export const whitelistedVehicles = sqliteTable("whitelisted_vehicles", {
  vehicleNumber: text("vehicle_number").notNull(),
  slotId: integer("slot_id").notNull().references(() => slots.id, { onDelete: "cascade" }),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.vehicleNumber, table.slotId] })
  }
});
