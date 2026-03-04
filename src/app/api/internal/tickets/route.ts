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

    // --- LOG DE AUTENTICAÇÃO ---
    console.log("[API CENTRAL:InternalTickets] Verificando autenticação", {
      headerRecebido: providedInternalKey ? "Sim (presente)" : "Não (ausente)",
      chaveServidorConfigurada: expectedInternalKey ? "Sim" : "Não",
      chavesCoincidem: providedInternalKey === expectedInternalKey,
      comprimentoEsperado: expectedInternalKey?.length,
      comprimentoRecebido: providedInternalKey?.length,
    });

    if (!expectedInternalKey || providedInternalKey !== expectedInternalKey) {
      console.error(
        "[API CENTRAL:InternalTickets] Erro 401: Chave interna inválida ou ausente",
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const payload = createInternalTicketSchema.safeParse(body);

    if (!payload.success) {
      console.error(
        "[API CENTRAL:InternalTickets] Erro 400: Payload inválido",
        payload.error.flatten(),
      );
      return NextResponse.json(
        { error: "Payload invalido", details: payload.error.flatten() },
        { status: 400 },
      );
    }

    const { applicationId, companyId, userId, title, description } =
      payload.data;

    const [application, company, user, userCompany] = await Promise.all([
      db.query.applications.findFirst({
        where: eq(applications.id, applicationId),
      }),
      db.query.companies.findFirst({
        where: and(
          eq(companies.id, companyId),
          eq(companies.applicationId, applicationId),
        ),
      }),
      db.query.users.findFirst({
        where: and(
          eq(users.id, userId),
          eq(users.applicationId, applicationId),
        ),
      }),
      db.query.userCompanies.findFirst({
        where: and(
          eq(userCompanies.userId, userId),
          eq(userCompanies.companyId, companyId),
        ),
      }),
    ]);

    // --- LOG DE VERIFICAÇÃO DE DADOS ---
    console.log("[API CENTRAL:InternalTickets] Resultado da busca no DB", {
      applicationFound: !!application,
      companyFound: !!company,
      userFound: !!user,
      userCompanyFound: !!userCompany,
    });

    if (!application) {
      return NextResponse.json(
        { error: "Aplicacao nao encontrada" },
        { status: 400 },
      );
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

    console.log("[API CENTRAL:InternalTickets] Ticket criado com sucesso", {
      ticketId: createdTicket.id,
    });

    return NextResponse.json({
      success: true,
      ticketId: createdTicket.id,
    });
  } catch (error) {
    console.error("[API CENTRAL:InternalTickets] Erro Crítico no POST:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
