import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import {
  applications,
  companies,
  ticketMessages,
  tickets,
  userCompanies,
  users,
} from "@/lib/db/schema";

const createInternalTicketSchema = z.object({
  applicationId: z.string().uuid("applicationId invalido"),
  companyId: z.string().uuid("companyId invalido"),
  userId: z.string().uuid("userId invalido"),
  title: z.string().trim().min(5, "Titulo muito curto"),
  description: z.string().trim().min(10, "Descricao muito curta"),
});

export async function POST(request: Request) {
  try {
    const expectedInternalKey = process.env.INTERNAL_API_KEY;
    const providedInternalKey = request.headers.get("x-internal-key");

    if (!expectedInternalKey || providedInternalKey !== expectedInternalKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = createInternalTicketSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json(
        { error: "Payload invalido", details: payload.error.flatten() },
        { status: 400 },
      );
    }

    const { applicationId, companyId, userId, title, description } = payload.data;

    const [application, company, user, userCompany] = await Promise.all([
      db.query.applications.findFirst({
        where: and(eq(applications.id, applicationId), eq(applications.isActive, true)),
      }),
      db.query.companies.findFirst({
        where: and(
          eq(companies.id, companyId),
          eq(companies.applicationId, applicationId),
          eq(companies.status, "active"),
        ),
      }),
      db.query.users.findFirst({
        where: and(
          eq(users.id, userId),
          eq(users.applicationId, applicationId),
          eq(users.isActive, true),
        ),
      }),
      db.query.userCompanies.findFirst({
        where: and(eq(userCompanies.userId, userId), eq(userCompanies.companyId, companyId)),
      }),
    ]);

    if (!application) {
      return NextResponse.json({ error: "Aplicacao nao encontrada" }, { status: 400 });
    }

    if (!company) {
      return NextResponse.json(
        { error: "Empresa nao encontrada para a aplicacao informada" },
        { status: 400 },
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "Usuario nao encontrado para a aplicacao informada" },
        { status: 400 },
      );
    }

    if (!userCompany) {
      return NextResponse.json(
        { error: "Usuario nao vinculado a empresa informada" },
        { status: 400 },
      );
    }

    const [createdTicket] = await db
      .insert(tickets)
      .values({
        applicationId,
        companyId,
        userId,
        title,
        subject: title,
        description,
        status: "aguardando",
      })
      .returning({ id: tickets.id });

    await db.insert(ticketMessages).values({
      ticketId: createdTicket.id,
      userId,
      content: description,
    });

    return NextResponse.json({
      success: true,
      ticketId: createdTicket.id,
    });
  } catch (error) {
    console.error("Internal Tickets POST Error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
