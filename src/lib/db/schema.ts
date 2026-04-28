import {
  pgEnum,
  pgSchema,
  uuid,
  text,
  timestamp,
  varchar,
  boolean,
  numeric,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const core = pgSchema("core");

export const ticketMessageSourceEnum = pgEnum("ticket_message_source", [
  "user",
  "support",
]);

export const contractStatusEnum = pgEnum("contract_status", [
  "Ativo",
  "Cancelado",
  "Inadimplente",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "Pendente",
  "Pago",
  "Vencido",
  "Cancelado",
]);

export const expenseCategoryEnum = pgEnum("expense_category", [
  "Infraestrutura",
  "APIs",
  "Operacional",
  "Marketing",
  "Pessoal",
  "Tributos",
  "Outros",
]);

export const systemSettings = core.table("system_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  instanceName: text("instance_name").notNull().default("eeyCore"),
  apiUrl: text("api_url").notNull().default("https://api.eeytech.com.br"),
  sessionTimeout: text("session_timeout").notNull().default("15"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const applications = core.table("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 50 }).unique().notNull(),
  apiKey: text("api_key").unique().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const companies = core.table("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  tradeName: text("trade_name"),
  cnpj: varchar("cnpj", { length: 18 }),
  email: text("email"),
  phone: varchar("phone", { length: 20 }),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  zipCode: varchar("zip_code", { length: 9 }),
  street: text("street"),
  number: varchar("number", { length: 20 }),
  complement: text("complement"),
  neighborhood: text("neighborhood"),
  city: text("city"),
  state: varchar("state", { length: 2 }),
  applicationId: uuid("application_id")
    .references(() => applications.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const contracts = core.table("contracts", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .references(() => companies.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  status: contractStatusEnum("status").default("Ativo").notNull(),
  startDate: timestamp("start_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  endDate: timestamp("end_date"),
  documentUrl: text("document_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const payments = core.table("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .references(() => companies.id, { onDelete: "cascade" })
    .notNull(),
  contractId: uuid("contract_id").references(() => contracts.id, {
    onDelete: "set null",
  }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  status: paymentStatusEnum("status").default("Pendente").notNull(),
  dueDate: timestamp("due_date").notNull(),
  paidAt: timestamp("paid_at"),
  description: text("description"),
  referenceMonth: varchar("reference_month", { length: 7 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const expenses = core.table("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  description: text("description").notNull(),
  category: expenseCategoryEnum("category").default("Outros").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  expenseDate: timestamp("expense_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = core.table("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  applicationId: uuid("application_id")
    .references(() => applications.id, { onDelete: "cascade" })
    .notNull(),
  isApplicationAdmin: boolean("is_application_admin").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const modules = core.table("modules", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .references(() => applications.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 50 }).notNull(),
});

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
  (table) => ({
    pk: primaryKey({
      columns: [table.userId, table.applicationId, table.moduleSlug],
    }),
  }),
);

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

export const rolePermissions = core.table("role_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  roleId: uuid("role_id")
    .references(() => roles.id, { onDelete: "cascade" })
    .notNull(),
  moduleSlug: text("module_slug").notNull(),
  actions: text("actions").array().notNull(),
});

export const userRoles = core.table(
  "user_roles",
  {
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    roleId: uuid("role_id")
      .references(() => roles.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.roleId] }),
  }),
);

export const userCompanies = core.table(
  "user_companies",
  {
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    companyId: uuid("company_id")
      .references(() => companies.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.companyId] }),
  }),
);

export const sessions = core.table("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  token: text("token").unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tickets = core.table("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .references(() => applications.id, { onDelete: "cascade" })
    .notNull(),
  companyId: uuid("company_id")
    .references(() => companies.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  title: text("title").notNull().default("Sem titulo"),
  description: text("description").notNull().default(""),
  subject: text("subject").notNull(),
  status: varchar("status", { length: 20 }).default("Aberto").notNull(),
  priority: varchar("priority", { length: 20 }).default("MEDIUM").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const ticketMessages = core.table("ticket_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id")
    .references(() => tickets.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  content: text("content").notNull(),
  source: ticketMessageSourceEnum("source").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const modulesRelations = relations(modules, ({ one }) => ({
  application: one(applications, {
    fields: [modules.applicationId],
    references: [applications.id],
  }),
}));

export const userModulePermissionsRelations = relations(
  userModulePermissions,
  ({ one }) => ({
    user: one(users, {
      fields: [userModulePermissions.userId],
      references: [users.id],
    }),
    application: one(applications, {
      fields: [userModulePermissions.applicationId],
      references: [applications.id],
    }),
  }),
);

export const rolesRelations = relations(roles, ({ one, many }) => ({
  application: one(applications, {
    fields: [roles.applicationId],
    references: [applications.id],
  }),
  permissions: many(rolePermissions),
  users: many(userRoles),
}));

export const rolePermissionsRelations = relations(
  rolePermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [rolePermissions.roleId],
      references: [roles.id],
    }),
  }),
);

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

export const userCompaniesRelations = relations(userCompanies, ({ one }) => ({
  user: one(users, {
    fields: [userCompanies.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [userCompanies.companyId],
    references: [companies.id],
  }),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  application: one(applications, {
    fields: [tickets.applicationId],
    references: [applications.id],
  }),
  company: one(companies, {
    fields: [tickets.companyId],
    references: [companies.id],
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

export const usersRelations = relations(users, ({ one, many }) => ({
  application: one(applications, {
    fields: [users.applicationId],
    references: [applications.id],
  }),
  tickets: many(tickets),
  messages: many(ticketMessages),
  permissions: many(userModulePermissions),
  roles: many(userRoles),
  companies: many(userCompanies),
}));

export const applicationsRelations = relations(applications, ({ many }) => ({
  tickets: many(tickets),
  modules: many(modules),
  userPermissions: many(userModulePermissions),
  roles: many(roles),
  users: many(users),
  companies: many(companies),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  application: one(applications, {
    fields: [companies.applicationId],
    references: [applications.id],
  }),
  users: many(userCompanies),
  tickets: many(tickets),
  contracts: many(contracts),
  payments: many(payments),
}));

export const contractsRelations = relations(contracts, ({ one, many }) => ({
  company: one(companies, {
    fields: [contracts.companyId],
    references: [companies.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  company: one(companies, {
    fields: [payments.companyId],
    references: [companies.id],
  }),
  contract: one(contracts, {
    fields: [payments.contractId],
    references: [contracts.id],
  }),
}));
