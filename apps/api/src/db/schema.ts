import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "direktör",
  "müdür",
  "şef",
  "mühendis",
]);

export const machineStatusEnum = pgEnum("machine_status", [
  "aktif",
  "pasif",
  "bakımda",
]);

// ─── Tables ──────────────────────────────────────────────────────────────────

export const userGroups = pgTable("user_groups", {
  id: serial("id").primaryKey(),
  name: userRoleEnum("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  groupId: integer("group_id")
    .notNull()
    .references(() => userGroups.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Machine Lookup Tables ────────────────────────────────────────────────────

export const machineNames = pgTable("machine_names", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const machineLocations = pgTable("machine_locations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const machineManufacturers = pgTable("machine_manufacturers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const machines = pgTable("machines", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  nameId: integer("name_id")
    .notNull()
    .references(() => machineNames.id),
  description: text("description"),
  locationId: integer("location_id").references(() => machineLocations.id),
  status: machineStatusEnum("status").default("aktif").notNull(),
  manufacturerId: integer("manufacturer_id").references(
    () => machineManufacturers.id
  ),
  model: varchar("model", { length: 200 }),
  serialNumber: varchar("serial_number", { length: 100 }),
  purchaseDate: timestamp("purchase_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Relations ───────────────────────────────────────────────────────────────

export const userGroupsRelations = relations(userGroups, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one }) => ({
  group: one(userGroups, {
    fields: [users.groupId],
    references: [userGroups.id],
  }),
}));

export const machineNamesRelations = relations(machineNames, ({ many }) => ({
  machines: many(machines),
}));

export const machineLocationsRelations = relations(
  machineLocations,
  ({ many }) => ({
    machines: many(machines),
  })
);

export const machineManufacturersRelations = relations(
  machineManufacturers,
  ({ many }) => ({
    machines: many(machines),
  })
);

export const machinesRelations = relations(machines, ({ one }) => ({
  machineName: one(machineNames, {
    fields: [machines.nameId],
    references: [machineNames.id],
  }),
  machineLocation: one(machineLocations, {
    fields: [machines.locationId],
    references: [machineLocations.id],
  }),
  machineManufacturer: one(machineManufacturers, {
    fields: [machines.manufacturerId],
    references: [machineManufacturers.id],
  }),
}));
