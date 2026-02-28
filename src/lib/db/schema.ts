import {
  pgSchema,
  uuid,
  text,
  timestamp,
  varchar,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const core = pgSchema("core");

// --- CONFIGURAÇÕES DO SISTEMA (SINGLETON) ---
export const systemSettings = core.table("system_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  instanceName: text("instance_name").notNull().default("Admin Eeytech"),
  apiUrl: text("api_url").notNull().default("https://api.eeytech.com.br"),
  sessionTimeout: text("session_timeout").notNull().default("15"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- APLICAÇÕES (SaaS) ---
export const applications = core.table("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 50 }).unique().notNull(),
  apiKey: text("api_key").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- USUÁRIOS ---
export const users = core.table("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- MÓDULOS (Funcionalidades por App) ---
export const modules = core.table("modules", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .references(() => applications.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 50 }).notNull(),
});

// --- PERMISSÕES INDIVIDUAIS (MBAC Legado/Direto) ---
export const userModulePermissions = core.table(
  "user_module_permissions",
  {
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    applicationId: uuid("application_id")
      .references(() => applications.id, { onDelete: "cascade" })
      .notNull(),
    moduleSlug: text("module_slug").notNull(),
    actions: text("actions").array().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.applicationId, t.moduleSlug] }),
  }),
);

// --- PAPÉIS (ROLES) ---
export const roles = core.table("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .references(() => applications.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 50 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- PERMISSÕES DO PAPEL ---
export const rolePermissions = core.table("role_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  roleId: uuid("role_id")
    .references(() => roles.id, { onDelete: "cascade" })
    .notNull(),
  moduleSlug: text("module_slug").notNull(),
  actions: text("actions").array().notNull(),
});

// --- VÍNCULO USUÁRIO-PAPEL ---
export const userRoles = core.table("user_roles", {
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  roleId: uuid("role_id")
    .references(() => roles.id, { onDelete: "cascade" })
    .notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.roleId] }),
}));

// --- SESSÕES (Refresh Tokens) ---
export const sessions = core.table("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  token: text("token").unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- SISTEMA DE CHAMADOS (TICKETS) ---
export const tickets = core.table("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .references(() => applications.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  subject: text("subject").notNull(),
  status: varchar("status", { length: 20 }).default("OPEN").notNull(),
  priority: varchar("priority", { length: 20 }).default("MEDIUM").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- MENSAGENS DOS CHAMADOS ---
export const ticketMessages = core.table("ticket_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id")
    .references(() => tickets.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- RELAÇÕES ---

export const modulesRelations = relations(modules, ({ one }) => ({
  application: one(applications, {
    fields: [modules.applicationId],
    references: [applications.id],
  }),
}));

export const userModulePermissionsRelations = relations(userModulePermissions, ({ one }) => ({
  user: one(users, {
    fields: [userModulePermissions.userId],
    references: [users.id],
  }),
  application: one(applications, {
    fields: [userModulePermissions.applicationId],
    references: [applications.id],
  }),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  application: one(applications, {
    fields: [roles.applicationId],
    references: [applications.id],
  }),
  permissions: many(rolePermissions),
  users: many(userRoles),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  application: one(applications, {
    fields: [tickets.applicationId],
    references: [applications.id],
  }),
  user: one(users, {
    fields: [tickets.userId],
    references: [users.id],
  }),
  messages: many(ticketMessages),
}));

export const ticketMessagesRelations = relations(ticketMessages, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketMessages.ticketId],
    references: [tickets.id],
  }),
  user: one(users, {
    fields: [ticketMessages.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  tickets: many(tickets),
  messages: many(ticketMessages),
  permissions: many(userModulePermissions),
  roles: many(userRoles),
}));

export const applicationsRelations = relations(applications, ({ many }) => ({
  tickets: many(tickets),
  modules: many(modules),
  userPermissions: many(userModulePermissions),
  roles: many(roles),
}));