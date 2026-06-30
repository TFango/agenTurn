import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  text,
  jsonb,
  date,
  time,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const planEnum = pgEnum("plan", ["free", "pro"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "inactive",
  "trial",
]);
export const appointmentStatusEnum = pgEnum("appointment_status", [
  "pending",
  "confirmed",
  "cancelled",
]);
export const userRoleEnum = pgEnum("role", ["admin", "professional"]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "new_appointment",
  "cancelled_appointment",
  "human_handoff",
]);
export const conversationStateEnum = pgEnum("conversation_state_enum", [
  "greeting",
  "select_service",
  "select_professional",
  "select_date",
  "select_time",
  "confirm",
  "confirmed",
  "cancel_select",
  "cancel_confirm",
  "human_handoff",
  "waitlist",
  "select_category",
]);

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  whatsapp_number: varchar("whatsapp_number", { length: 50 }).notNull(),
  phone_number_id: varchar("phone_number_id", { length: 50 }).notNull(),
  meta_access_token: varchar("meta_access_token", { length: 512 }),
  plan: planEnum("plan").notNull(),
  subscription_status: subscriptionStatusEnum("subscription_status").notNull(),
  slot_interval_minutes: integer("slot_interval_minutes").notNull().default(30),
  created_at: timestamp("created_at").defaultNow(),
});

export const professionals = pgTable("professionals", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  active: boolean("active").notNull().default(true),
});

export const serviceCategories = pgTable("service_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }),
  created_at: timestamp("created_at").defaultNow(),
});

export const professionalCategories = pgTable("professional_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  professional_id: uuid("professional_id").notNull(),
  category_id: uuid("category_id").notNull(),
});

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  duration_minutes: integer("duration_minutes").notNull(),
  price: integer("price").notNull(),
  active: boolean("active").notNull().default(true),
  category_id: uuid("category_id"),
});

export const workingHours = pgTable("working_hours", {
  id: uuid("id").primaryKey().defaultRandom(),
  professional_id: uuid("professional_id").notNull(),
  day_of_week: integer("day_of_week"),
  start_time: time("start_time"),
  end_time: time("end_time"),
});

export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: uuid("tenant_id").notNull(),
  professional_id: uuid("professional_id").notNull(),
  service_id: uuid("service_id").notNull(),
  client_id: uuid("client_id").notNull(),
  datetime: timestamp("datetime").notNull(),
  status: appointmentStatusEnum("status").notNull(),
});

export const blockedDates = pgTable("blocked_dates", {
  id: uuid("id").primaryKey().defaultRandom(),
  professional_id: uuid("professional_id").notNull(),
  date: date("date"),
  reason: varchar("reason", { length: 255 }),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: uuid("tenant_id").notNull(),
  professional_id: uuid("professional_id"),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  password_hash: varchar("password_hash", { length: 255 }),
  role: userRoleEnum("role"),
  active: boolean("active"),
  created_at: timestamp("created_at").defaultNow(),
});

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }),
  whatsapp_number: varchar("whatsapp_number", { length: 50 }),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
}, (t) => [uniqueIndex("clients_tenant_whatsapp_idx").on(t.tenant_id, t.whatsapp_number)]);

export const conversationStates = pgTable("conversation_states", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: uuid("tenant_id").notNull(),
  client_whatsapp: varchar("client_whatsapp", { length: 50 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  temp_data: jsonb("temp_data").$type<Record<string, unknown>>().notNull().default({}),
  updated_at: timestamp("updated_at"),
}, (t) => [uniqueIndex("conversation_states_tenant_whatsapp_idx").on(t.tenant_id, t.client_whatsapp)]);

export const waitlist = pgTable("waitlist", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: uuid("tenant_id").notNull(),
  client_id: uuid("client_id").notNull(),
  service_id: uuid("service_id").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: uuid("tenant_id").notNull(),
  type: notificationTypeEnum("type"),
  title: varchar("title", { length: 255 }),
  body: varchar("body", { length: 500 }),
  read: boolean("read").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  tenant_id: uuid("tenant_id").notNull(),
  endpoint: text("endpoint").notNull(),
  keys: jsonb("keys").$type<{ p256dh: string; auth: string }>().notNull(),
  created_at: timestamp("created_at").defaultNow(),
});
