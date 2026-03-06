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

// Schema de validação do payload vindo do SaaS
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

    // Validação da Chave Interna
    if (!expectedInternalKey || providedInternalKey !== expectedInternalKey) {
      console.error("[API CENTRAL:InternalTickets] Erro 401: Chave inválida");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const payload = createInternalTicketSchema.safeParse(body);

    if (!payload.success) {
      return NextResponse.json(
        { error: "Payload invalido", details: payload.error.flatten() },
        { status: 400 },
      );
    }

    const { applicationId, companyId, userId, title, description } =
      payload.data;

    // 1. Verificar se a Aplicação e a Empresa existem no banco central
    const [application, company] = await Promise.all([
      db.query.applications.findFirst({
        where: eq(applications.id, applicationId),
      }),
      db.query.companies.findFirst({
        where: eq(companies.id, companyId),
      }),
    ]);

    if (!application) {
      return NextResponse.json(
        { error: "Aplicacao nao encontrada" },
        { status: 400 },
      );
    }
    if (!company) {
      return NextResponse.json(
        { error: "Empresa nao encontrada" },
        { status: 400 },
      );
    }

    // 2. Verificar se o usuário existe
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario nao encontrado no sistema central" },
        { status: 400 },
      );
    }

    // 3. AUTO-VÍNCULO: Garantir que o usuário está vinculado à empresa (user_companies)
    // Usamos onConflictDoNothing para evitar erros se o vínculo já existir
    await db
      .insert(userCompanies)
      .values({
        userId,
        companyId,
      })
      .onConflictDoNothing();

    // 4. AUTO-ATUALIZAÇÃO: Garantir que o applicationId do usuário reflete a aplicação atual
    if (user.applicationId !== applicationId) {
      await db.update(users).set({ applicationId }).where(eq(users.id, userId));
    }

    // 5. Criar o Ticket dentro de uma transação para garantir integridade
    const result = await db.transaction(async (tx) => {
      const [newTicket] = await tx
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

      // Inserir a primeira mensagem do ticket
      await tx.insert(ticketMessages).values({
        ticketId: newTicket.id,
        userId,
        content: description,
      });

      return newTicket;
    });

    console.log("[API CENTRAL:InternalTickets] Ticket criado com sucesso", {
      ticketId: result.id,
    });

    return NextResponse.json({
      success: true,
      ticketId: result.id,
    });
  } catch (error) {
    console.error("[API CENTRAL:InternalTickets] Erro Crítico no POST:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
