import { NextResponse } from "next/server";
import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { applications, ticketMessages, tickets, users } from "@/lib/db/schema";
import { verifyAccessToken } from "@/lib/auth/jwt";

const VALID_STATUSES = ["aguardando", "em_atendimento", "concluido"] as const;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams;

    const authHeader = req.headers.get("authorization");
    const apiKeyHeader = req.headers.get("x-api-key");

    let forcedApplicationId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const payload = verifyAccessToken(token);
      if (!payload) {
        return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
      }
    } else if (apiKeyHeader) {
      const app = await db.query.applications.findFirst({
        where: eq(applications.apiKey, apiKeyHeader),
      });

      if (!app) {
        return NextResponse.json({ error: "API key invalida" }, { status: 401 });
      }

      forcedApplicationId = app.id;
    } else {
      return NextResponse.json({ error: "Credenciais ausentes" }, { status: 401 });
    }

    const status = search.get("status");
    const applicationId = forcedApplicationId ?? search.get("applicationId");
    const userId = search.get("userId");
    const q = search.get("q");
    const dateFrom = search.get("dateFrom");
    const dateTo = search.get("dateTo");

    const filters = [];

    if (status && (VALID_STATUSES as readonly string[]).includes(status)) {
      filters.push(eq(tickets.status, status));
    }
    if (applicationId) {
      filters.push(eq(tickets.applicationId, applicationId));
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
      where: filters.length > 0 ? and(...filters) : undefined,
      with: {
        application: true,
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

    if (authHeader?.startsWith("Bearer ")) {
      const payload = verifyAccessToken(authHeader.split(" ")[1]);
      if (!payload) {
        return NextResponse.json({ error: "Token invalido" }, { status: 401 });
      }

      userId = payload.sub;
      applicationId = body.applicationId;
    } else if (apiKeyHeader) {
      const app = await db.query.applications.findFirst({
        where: eq(applications.apiKey, apiKeyHeader),
      });

      if (!app) {
        return NextResponse.json({ error: "API key invalida" }, { status: 401 });
      }

      applicationId = app.id;
      userId = body.userId;
    } else {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const app = await db.query.applications.findFirst({
      where: and(eq(applications.id, applicationId), eq(applications.isActive, true)),
    });
    const user = await db.query.users.findFirst({
      where: and(eq(users.id, userId), eq(users.isActive, true)),
    });

    if (!app || !user) {
      return NextResponse.json({ error: "Aplicacao ou usuario invalido" }, { status: 400 });
    }

    const status =
      VALID_STATUSES.includes(body.status) ? body.status : "aguardando";

    const title = String(body.title ?? body.subject ?? "").trim();
    const description = String(body.description ?? body.content ?? "").trim();

    if (title.length < 5 || description.length < 10) {
      return NextResponse.json(
        { error: "Titulo ou descricao invalidos" },
        { status: 400 },
      );
    }

    const result = await db.transaction(async (tx) => {
      const [newTicket] = await tx
        .insert(tickets)
        .values({
          applicationId,
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

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Tickets POST Error:", error);
    return NextResponse.json({ error: "Erro ao criar chamado" }, { status: 500 });
  }
}
