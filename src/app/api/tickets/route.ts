import { NextResponse } from "next/server";
import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  applications,
  companies,
  ticketMessages,
  tickets,
  users,
  userCompanies,
} from "@/lib/db/schema";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { validateCompanyAccessFromPayload } from "@/lib/auth/company-context";
import {
  TICKET_STATUSES,
  normalizeTicketStatus,
} from "@/lib/tickets/status";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams;

    const authHeader = req.headers.get("authorization");
    const apiKeyHeader = req.headers.get("x-api-key");

    let forcedApplicationId: string | null = null;
    let forcedCompanyId: string | null = null;
    let isAppAdmin = false;

    // 1. Identificação do Contexto (Token ou API Key)
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const payload = verifyAccessToken(token);
      if (!payload) {
        return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
      }

      isAppAdmin = payload.isApplicationAdmin || false;
      forcedApplicationId = payload.applicationId;
      forcedCompanyId = payload.activeCompanyId;

      // Se não for admin, validamos estritamente o acesso à empresa ativa
      if (!isAppAdmin) {
        const allowed = await validateCompanyAccessFromPayload(
          payload,
          forcedCompanyId,
        );
        if (!allowed) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
      }
    } else if (apiKeyHeader) {
      const app = await db.query.applications.findFirst({
        where: eq(applications.apiKey, apiKeyHeader),
      });

      if (!app) {
        return NextResponse.json(
          { error: "API key invalida" },
          { status: 401 },
        );
      }

      forcedApplicationId = app.id;
      forcedCompanyId = search.get("companyId");
    } else {
      return NextResponse.json(
        { error: "Credenciais ausentes" },
        { status: 401 },
      );
    }

    // 2. Construção dos Filtros
    const filters = [];

    // Lógica de Filtro de Segurança
    if (!isAppAdmin) {
      // Usuário comum: Vê apenas o que pertence à sua aplicação E empresa ativa
      filters.push(eq(tickets.applicationId, forcedApplicationId!));
      if (forcedCompanyId) {
        filters.push(eq(tickets.companyId, forcedCompanyId));
      }
    } else {
      // Administrador: Vê tudo da aplicação, mas pode filtrar por empresa específica
      const reqAppId = search.get("applicationId") || forcedApplicationId;
      const reqCompId = search.get("companyId");

      if (reqAppId) filters.push(eq(tickets.applicationId, reqAppId));
      if (reqCompId) filters.push(eq(tickets.companyId, reqCompId));
    }

    // Filtros de busca e data
    const status = search.get("status");
    const userId = search.get("userId");
    const q = search.get("q");
    const dateFrom = search.get("dateFrom");
    const dateTo = search.get("dateTo");

    if (status && (TICKET_STATUSES as readonly string[]).includes(status)) {
      filters.push(eq(tickets.status, status));
    }
    if (userId) {
      filters.push(eq(tickets.userId, userId));
    }
    if (dateFrom) {
      filters.push(gte(tickets.createdAt, new Date(dateFrom)));
    }
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      filters.push(lte(tickets.createdAt, endOfDay));
    }
    if (q) {
      filters.push(
        or(
          ilike(tickets.title, `%${q}%`),
          ilike(tickets.description, `%${q}%`),
          sql`CAST(${tickets.id} AS TEXT) ILIKE ${`%${q}%`}`,
        )!,
      );
    }

    const rows = await db.query.tickets.findMany({
      where: and(...filters),
      with: {
        application: true,
        company: true,
        user: true,
      },
      orderBy: [desc(tickets.createdAt)],
    });

    return NextResponse.json(rows);
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
    let companyId: string;

    // 1. Extração de Identidade
    if (authHeader?.startsWith("Bearer ")) {
      const payload = verifyAccessToken(authHeader.split(" ")[1]);
      if (!payload)
        return NextResponse.json({ error: "Token invalido" }, { status: 401 });

      userId = payload.sub;
      applicationId = payload.applicationId;
      companyId = payload.activeCompanyId;
    } else if (apiKeyHeader) {
      const app = await db.query.applications.findFirst({
        where: eq(applications.apiKey, apiKeyHeader),
      });
      if (!app)
        return NextResponse.json(
          { error: "API key invalida" },
          { status: 401 },
        );

      applicationId = app.id;
      companyId = body.companyId;
      userId = body.userId;
    } else {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    // 2. Validação e Auto-Ajuste (Resiliência)
    const [app, user] = await Promise.all([
      db.query.applications.findFirst({
        where: eq(applications.id, applicationId),
      }),
      db.query.users.findFirst({ where: eq(users.id, userId) }),
    ]);

    if (!app || !user) {
      return NextResponse.json(
        { error: "Aplicacao ou usuario nao encontrado" },
        { status: 400 },
      );
    }

    // Garantir vínculo com a empresa
    await db
      .insert(userCompanies)
      .values({ userId, companyId })
      .onConflictDoNothing();

    // Garantir que o usuário está na aplicação correta
    if (user.applicationId !== applicationId) {
      await db.update(users).set({ applicationId }).where(eq(users.id, userId));
    }

    // 3. Criação do Ticket
    const status = normalizeTicketStatus(body.status);
    const title = String(body.title ?? body.subject ?? "").trim();
    const description = String(body.description ?? body.content ?? "").trim();

    if (title.length < 5 || description.length < 10) {
      return NextResponse.json(
        { error: "Titulo ou descricao muito curtos" },
        { status: 400 },
      );
    }

    const result = await db.transaction(async (tx) => {
      const [newTicket] = await tx
        .insert(tickets)
        .values({
          applicationId,
          companyId,
          userId,
          title,
          description,
          subject: title,
          status,
        })
        .returning();

      await tx.insert(ticketMessages).values({
        ticketId: newTicket.id,
        userId,
        content: description,
      });

      return newTicket;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Chamado criado com sucesso",
        ticket: result,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Tickets POST Error:", error);
    return NextResponse.json(
      { error: "Erro ao criar chamado" },
      { status: 500 },
    );
  }
}
