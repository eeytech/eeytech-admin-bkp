"use server";

import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { db } from "@/lib/db";
import { tickets, ticketMessages } from "@/lib/db/schema";
import { requireModulePermission } from "@/lib/permissions/mbac";
import { revalidatePath } from "next/cache";

const actionClient = createSafeActionClient();

const createTicketSchema = z.object({
  applicationId: z.string().uuid(),
  subject: z.string().min(5, "Assunto muito curto"),
  content: z.string().min(10, "Mensagem muito curta"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

export const createTicketAction = actionClient
  .schema(createTicketSchema)
  .action(async ({ parsedInput, ctx }) => {
    // Em Server Actions, o contexto pode vir de um middleware de autenticação do next-safe-action
    const session = await requireModulePermission("tickets", "WRITE");

    const [newTicket] = await db
      .insert(tickets)
      .values({
        applicationId: parsedInput.applicationId,
        userId: session.sub,
        subject: parsedInput.subject,
        priority: parsedInput.priority,
        status: "OPEN",
      })
      .returning();

    await db.insert(ticketMessages).values({
      ticketId: newTicket.id,
      userId: session.sub,
      content: parsedInput.content,
    });

    revalidatePath("/dashboard/tickets");
    return { ticketId: newTicket.id };
  });
