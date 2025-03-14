import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text().primaryKey().$default(() => crypto.randomUUID()),
  username: text().unique().notNull(),
  password: text().notNull(),
  role: text({ enum: ["ADMIN", "USER"] }).$default(() => "USER").notNull(),
  refreshToken: text("refresh_token"),
  isAuthenticated: integer("is_authenticated").$default(() => 0).notNull(),
  createdAt: text("created_at").$default(() => new Date().toISOString()).notNull(),
  updatedAt: text("updated_at").$default(() => new Date().toISOString()).notNull(),
});

export const sections = sqliteTable("parking_sections", {
  id: text().primaryKey().$default(() => crypto.randomUUID()),
  name: text().notNull(),
  createdAt: text("created_at").$default(() => new Date().toISOString()).notNull(),
  updatedAt: text("updated_at").$default(() => new Date().toISOString()).notNull(),
});

export const userPrivileges = sqliteTable("user_privileges", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sectionId: text("section_id").notNull().references(() => sections.id, { onDelete: "cascade" }),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.sectionId] })
  };
});

export const floors = sqliteTable("parking_floors", {
  id: text().primaryKey().$default(() => crypto.randomUUID()),
  name: text().notNull(),
  sectionId: text("section_id").notNull().references(() => sections.id, { onDelete: "cascade" }),
  capacity: integer().notNull(),
  createdAt: text("created_at").$default(() => new Date().toISOString()).notNull(),
  updatedAt: text("updated_at").$default(() => new Date().toISOString()).notNull(),
});

export const slots = sqliteTable("parking_slots", {
  id: text().primaryKey().$default(() => crypto.randomUUID()),
  name: text().notNull(),
  status: text({ enum: ["FREE", "OCCUPIED"] }).$default(() => "FREE").notNull(),
  floorId: text("floor_id").notNull().references(() => floors.id, { onDelete: "cascade" }),
  createdAt: text("created_at").$default(() => new Date().toISOString()).notNull(),
  updatedAt: text("updated_at").$default(() => new Date().toISOString()).notNull(),
});

export const parkingHistory = sqliteTable("parking_history", {
  id: text().primaryKey().$default(() => crypto.randomUUID()),
  slotId: text("slot_id").notNull().references(() => slots.id, { onDelete: "cascade" }),
  vehicleNumber: text("vehicle_number").notNull(),
  vehicleType: text("vehicle_type", { enum: ["CAR", "MOTORBIKE"] }).notNull(),
  checkedInAt: text("checked_in_at").$default(() => new Date().toISOString()).notNull(),
  checkedOutAt: text("checked_out_at"),
  fee: integer("fee"),
  paymentStatus: text("payment_status", { enum: ["PENDING", "PAID", "WAIVED"] }).$default(() => "PENDING").notNull(),
  notes: text("notes"),
});
