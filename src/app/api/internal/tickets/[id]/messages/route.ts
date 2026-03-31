import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import {
  ticketMessageSourceEnum,
  ticketMessages,
  tickets,
  users,
} from "@/lib/db/schema";

const createInternalTicketMessageSchema = z.object({
  content: z.string().trim().min(1, "Conteudo obrigatorio"),
  userId: z.string().uuid("userId invalido"),
  source: z.enum(ticketMessageSourceEnum.enumValues, {
    error: "source invalido",
  }),
});

function isUnauthorized(request: Request) {
  const expectedInternalKey = process.env.INTERNAL_API_KEY;
  const providedInternalKey = request.headers.get("x-internal-key");

  return !expectedInternalKey || providedInternalKey !== expectedInternalKey;
}

function isSupportSource(source: string) {
  const normalizedSource = source.trim().toLowerCase();
  return normalizedSource === "support" || normalizedSource === "suporte";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (isUnauthorized(request)) {
      console.error(
        "[API CENTRAL:InternalTicketMessages] Erro 401 no GET: Chave invalida",
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const ticket = await db.query.tickets.findFirst({
      where: eq(tickets.id, id),
      columns: { id: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket nao encontrado" }, { status: 404 });
    }

    const messages = await db.query.ticketMessages.findMany({
      where: eq(ticketMessages.ticketId, id),
      orderBy: [asc(ticketMessages.createdAt)],
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      messages.map((message) => ({
        id: message.id,
        content: message.content,
        source: message.source,
        createdAt: message.createdAt,
        userId: message.userId,
        user: message.user,
      })),
    );
  } catch (error) {
    console.error("[API CENTRAL:InternalTicketMessages] Erro Critico no GET:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (isUnauthorized(request)) {
      console.error(
        "[API CENTRAL:InternalTicketMessages] Erro 401 no POST: Chave invalida",
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const payload = createInternalTicketMessageSchema.safeParse(body);

    if (!payload.success) {
      return NextResponse.json(
        { error: "Payload invalido", details: payload.error.flatten() },
        { status: 400 },
      );
    }

    const { content, userId, source } = payload.data;

    const [ticket, user] = await Promise.all([
      db.query.tickets.findFirst({
        where: eq(tickets.id, id),
        columns: { id: true, status: true },
      }),
      db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { id: true },
      }),
    ]);

    if (!ticket) {
      return NextResponse.json({ error: "Ticket nao encontrado" }, { status: 404 });
    }

    if (!user) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 400 });
    }

    const createdMessage = await db.transaction(async (tx) => {
      const [newMessage] = await tx
        .insert(ticketMessages)
        .values({
          ticketId: id,
          userId,
          content,
          source,
        })
        .returning({
          id: ticketMessages.id,
          content: ticketMessages.content,
          source: ticketMessages.source,
          createdAt: ticketMessages.createdAt,
          userId: ticketMessages.userId,
        });

      await tx
        .update(tickets)
        .set({
          status: isSupportSource(source) ? "Em Atendimento" : ticket.status,
          updatedAt: new Date(),
        })
        .where(eq(tickets.id, id));

      return newMessage;
    });

    return NextResponse.json(createdMessage, { status: 201 });
  } catch (error) {
    console.error("[API CENTRAL:InternalTicketMessages] Erro Critico no POST:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
