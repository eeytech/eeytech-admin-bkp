"use server";

import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { applications, ticketMessages, tickets, users } from "@/lib/db/schema";
import { requireModulePermission } from "@/lib/permissions/mbac";

const actionClient = createSafeActionClient();

const ticketStatusSchema = z.enum(["aguardando", "em_atendimento", "concluido"]);

export const createTicketAction = actionClient
  .schema(
    z.object({
      applicationId: z.string().uuid(),
      title: z.string().min(5, "Titulo muito curto"),
      description: z.string().min(10, "Descricao muito curta"),
      status: ticketStatusSchema.default("aguardando"),
    }),
  )
  .action(async ({ parsedInput }) => {
    const session = await requireModulePermission("tickets", "WRITE", "eeytech-admin");

    const app = await db.query.applications.findFirst({
      where: and(
        eq(applications.id, parsedInput.applicationId),
        eq(applications.isActive, true),
      ),
    });

    if (!app) {
      throw new Error("Aplicacao invalida");
    }

    const [newTicket] = await db
      .insert(tickets)
      .values({
        applicationId: parsedInput.applicationId,
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

  const [allApplications, allUsers] = await Promise.all([
    db.query.applications.findMany({
      orderBy: (table, { asc }) => [asc(table.name)],
    }),
    db.query.users.findMany({
      orderBy: (table, { asc }) => [asc(table.name)],
    }),
  ]);

  return {
    applications: allApplications.map((app) => ({ id: app.id, name: app.name })),
    users: allUsers.map((user) => ({ id: user.id, name: user.name, email: user.email })),
  };
});
