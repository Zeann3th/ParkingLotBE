import { index, integer, primaryKey, real, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer().primaryKey({ autoIncrement: true }),
  username: text().unique().notNull(),
  name: text().notNull().$default(() => "User_" + crypto.randomUUID().substring(0, 5)),
  password: text().notNull(),
  role: text({ enum: ["ADMIN", "USER", "SECURITY"] }).$default(() => "USER").notNull(),
  refreshToken: text("refresh_token"),
  createdAt: text("created_at").$default(() => new Date().toISOString()).notNull(),
  updatedAt: text("updated_at").$default(() => new Date().toISOString()).notNull(),
});

export const residences = sqliteTable("residences", {
  id: integer().primaryKey({ autoIncrement: true }),
  building: text().notNull(),
  room: integer().notNull()
})

export const userResidences = sqliteTable("user_residences", {
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  residenceId: integer("residence_id").notNull().references(() => residences.id, { onDelete: "cascade" })
}, (table) => [
  primaryKey({ columns: [table.userId, table.residenceId], name: "pk_user_residences" }),
])

export const residenceVehicles = sqliteTable("residence_vehicles", {
  residenceId: integer("residence_id").notNull().references(() => residences.id, { onDelete: "cascade" }),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "cascade" })
}, (table) => [
  primaryKey({ columns: [table.vehicleId, table.residenceId], name: "pk_residence_vehicles" }),
])

export const sections = sqliteTable("sections", {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().unique().notNull(),
  capacity: integer().notNull(),
});

export const userPrivileges = sqliteTable("user_privileges", {
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sectionId: integer("section_id").notNull().references(() => sections.id, { onDelete: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.userId, table.sectionId], name: "pk_user_privileges" }),
]);

export const vehicles = sqliteTable("vehicles", {
  id: integer().primaryKey({ autoIncrement: true }),
  plate: text().unique().notNull(),
  type: text({ enum: ["CAR", "MOTORBIKE"] }).notNull(),
});

export const vehicleReservations = sqliteTable("vehicle_reservations", {
  ticketId: integer("ticket_id").notNull().references(() => tickets.id, { onDelete: "cascade" }),
  sectionId: integer("section_id").notNull().references(() => sections.id, { onDelete: "cascade" }),
  slot: integer().notNull(),
}, (table) => [
  primaryKey({ columns: [table.sectionId, table.slot], name: "pk_vehicle_reservations" }),
]);

export const tickets = sqliteTable("tickets", {
  id: integer().primaryKey({ autoIncrement: true }),
  type: text("type", { enum: ["MONTHLY", "DAILY", "RESERVED"] }).notNull(),
  status: text("status", { enum: ["AVAILABLE", "INUSE", "LOST"] }).$default(() => "AVAILABLE").notNull(),
});

export const ticketPrices = sqliteTable("ticket_prices", {
  type: text("type", { enum: ["MONTHLY", "DAILY", "RESERVED"] }).notNull(),
  vehicleType: text("vehicle_type", { enum: ["CAR", "MOTORBIKE"] }).notNull(),
  price: real().notNull(),
}, (table) => [
  primaryKey({ columns: [table.type, table.vehicleType], name: "pk_ticket_prices" }),
]);

export const userTickets = sqliteTable("user_tickets", {
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  ticketId: integer("ticket_id").notNull().references(() => tickets.id, { onDelete: "cascade" }),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.userId, table.ticketId], name: "pk_user_tickets" }),
]);

export const history = sqliteTable("history", {
  id: text().primaryKey().$default(() => crypto.randomUUID()),
  sectionId: integer("section_id").notNull().references(() => sections.id, { onDelete: "cascade" }),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
  checkedInAt: text("checked_in_at").$default(() => new Date().toISOString()).notNull(),
  checkedOutAt: text("checked_out_at"),
  ticketId: integer("ticket_id").references(() => tickets.id, { onDelete: "cascade" }),
  fee: real(),
});

export const notifications = sqliteTable("notifications", {
  id: integer().primaryKey({ autoIncrement: true }),
  from: integer("from").notNull().references(() => users.id, { onDelete: "cascade" }),
  to: integer("to").notNull().references(() => users.id, { onDelete: "cascade" }),
  message: text().notNull(),
  status: text("status", { enum: ["PENDING", "READ", "DELETED"] }).$default(() => "PENDING"),
  createdAt: text("created_at").$default(() => new Date().toISOString()).notNull(),
}, (table) => [
  index("to_idx").on(table.to)
])
