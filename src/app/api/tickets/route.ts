import { db } from "@/lib/db";
import { tickets, ticketMessages, applications } from "@/lib/db/schema";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { NextResponse } from "next/server";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    // 1. Validar Autenticação (JWT ou API Key)
    const authHeader = req.headers.get("authorization");
    const apiKeyHeader = req.headers.get("x-api-key");

    let userId: string | null = null;
    let appId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const payload = verifyAccessToken(token);
      if (!payload)
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
      userId = payload.sub;
      // No painel admin, buscamos todos ou filtramos por aplicação se vier no query param
    } else if (apiKeyHeader) {
      const app = await db.query.applications.findFirst({
        where: eq(applications.apiKey, apiKeyHeader),
      });
      if (!app)
        return NextResponse.json(
          { error: "API Key inválida" },
          { status: 401 },
        );
      appId = app.id;
    } else {
      return NextResponse.json(
        { error: "Credenciais ausentes" },
        { status: 401 },
      );
    }

    // 2. Buscar chamados
    // Se for via API Key, filtra apenas daquela aplicação. Se for JWT, depende da permissão.
    const results = await db.query.tickets.findMany({
      where: appId ? eq(tickets.applicationId, appId) : undefined,
      with: {
        // Assume-se que as relations foram configuradas no schema.ts
      },
      orderBy: [desc(tickets.createdAt)],
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Tickets GET Error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const apiKeyHeader = req.headers.get("x-api-key");
    const body = await req.json();

    let userId: string;
    let applicationId: string;

    // Validação de Identidade
    if (authHeader?.startsWith("Bearer ")) {
      const payload = verifyAccessToken(authHeader.split(" ")[1]);
      if (!payload)
        return NextResponse.json({ error: "Token inválido" }, { status: 401 });
      userId = payload.sub;
      applicationId = body.applicationId; // No painel, o usuário escolhe a app
    } else if (apiKeyHeader) {
      const app = await db.query.applications.findFirst({
        where: eq(applications.apiKey, apiKeyHeader),
      });
      if (!app)
        return NextResponse.json(
          { error: "API Key inválida" },
          { status: 401 },
        );
      applicationId = app.id;
      userId = body.userId; // Via API externa, deve-se informar qual usuário (ID do SaaS) está abrindo
    } else {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 3. Criar Ticket e Mensagem Inicial em Transação
    const result = await db.transaction(async (tx) => {
      const [newTicket] = await tx
        .insert(tickets)
        .values({
          applicationId,
          userId,
          subject: body.subject,
          priority: body.priority || "MEDIUM",
          status: "OPEN",
        })
        .returning();

      await tx.insert(ticketMessages).values({
        ticketId: newTicket.id,
        userId,
        content: body.content,
      });

      return newTicket;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Tickets POST Error:", error);
    return NextResponse.json(
      { error: "Erro ao criar chamado" },
      { status: 500 },
    );
  }
}
