"use server";

import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { applications, companies, ticketMessages, tickets, users } from "@/lib/db/schema";
import { requireCompanyContext, requireModulePermission } from "@/lib/permissions/mbac";

const actionClient = createSafeActionClient();

const ticketStatusSchema = z.enum(["aguardando", "em_atendimento", "concluido"]);

export const createTicketAction = actionClient
  .schema(
    z.object({
      title: z.string().min(5, "Titulo muito curto"),
      description: z.string().min(10, "Descricao muito curta"),
      status: ticketStatusSchema.default("aguardando"),
    }),
  )
  .action(async ({ parsedInput }) => {
    const session = await requireModulePermission("tickets", "WRITE", "eeytech-admin");
    const context = await requireCompanyContext();

    const [app, company] = await Promise.all([
      db.query.applications.findFirst({
        where: and(
          eq(applications.id, context.applicationId),
          eq(applications.isActive, true),
        ),
      }),
      db.query.companies.findFirst({
        where: and(
          eq(companies.id, context.companyId),
          eq(companies.applicationId, context.applicationId),
          eq(companies.status, "active"),
        ),
      }),
    ]);

    if (!app || !company) {
      throw new Error("Contexto de aplicacao/empresa invalido");
    }

    const [newTicket] = await db
      .insert(tickets)
      .values({
        applicationId: context.applicationId,
        companyId: context.companyId,
        userId: session.sub,
        title: parsedInput.title,
        description: parsedInput.description,
        subject: parsedInput.title,
        status: parsedInput.status,
      })
      .returning();

    await db.insert(ticketMessages).values({
      ticketId: newTicket.id,
      userId: session.sub,
      content: parsedInput.description,
    });

    revalidatePath("/dashboard/tickets");
    return { ticketId: newTicket.id };
  });

export const replyTicketAction = actionClient
  .schema(
    z.object({
      ticketId: z.string().uuid(),
      content: z.string().min(2, "Resposta muito curta"),
    }),
  )
  .action(async ({ parsedInput }) => {
    const session = await requireModulePermission("tickets", "WRITE", "eeytech-admin");
    const context = await requireCompanyContext();

    const targetTicket = await db.query.tickets.findFirst({
      where: and(
        eq(tickets.id, parsedInput.ticketId),
        eq(tickets.applicationId, context.applicationId),
        eq(tickets.companyId, context.companyId),
      ),
    });

    if (!targetTicket) {
      throw new Error("Unauthorized");
    }

    await db.insert(ticketMessages).values({
      ticketId: parsedInput.ticketId,
      userId: session.sub,
      content: parsedInput.content,
    });

    await db
      .update(tickets)
      .set({ updatedAt: new Date() })
      .where(eq(tickets.id, parsedInput.ticketId));

    revalidatePath(`/dashboard/tickets/${parsedInput.ticketId}`);
    revalidatePath("/dashboard/tickets");
    return { success: true };
  });

export const updateTicketStatusAction = actionClient
  .schema(
    z.object({
      ticketId: z.string().uuid(),
      status: ticketStatusSchema,
    }),
  )
  .action(async ({ parsedInput }) => {
    await requireModulePermission("tickets", "WRITE", "eeytech-admin");
    const context = await requireCompanyContext();

    const targetTicket = await db.query.tickets.findFirst({
      where: and(
        eq(tickets.id, parsedInput.ticketId),
        eq(tickets.applicationId, context.applicationId),
        eq(tickets.companyId, context.companyId),
      ),
    });

    if (!targetTicket) {
      throw new Error("Unauthorized");
    }

    await db
      .update(tickets)
      .set({
        status: parsedInput.status,
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, parsedInput.ticketId));

    revalidatePath(`/dashboard/tickets/${parsedInput.ticketId}`);
    revalidatePath("/dashboard/tickets");
    return { success: true };
  });

export const getTicketFiltersAction = actionClient.action(async () => {
  await requireModulePermission("tickets", "READ", "eeytech-admin");
  const context = await requireCompanyContext();

  const [allApplications, allUsers, allCompanies] = await Promise.all([
    db.query.applications.findMany({
      where: eq(applications.id, context.applicationId),
      orderBy: (table, { asc }) => [asc(table.name)],
    }),
    db.query.users.findMany({
      where: eq(users.applicationId, context.applicationId),
      orderBy: (table, { asc }) => [asc(table.name)],
    }),
    db.query.companies.findMany({
      where: and(
        eq(companies.applicationId, context.applicationId),
        eq(companies.status, "active"),
      ),
      orderBy: (table, { asc }) => [asc(table.name)],
    }),
  ]);

  return {
    applications: allApplications.map((app) => ({ id: app.id, name: app.name })),
    users: allUsers.map((user) => ({ id: user.id, name: user.name, email: user.email })),
    companies: allCompanies.map((company) => ({ id: company.id, name: company.name })),
    activeCompanyId: context.companyId,
  };
});

