import { and, asc, eq } from "drizzle-orm";
import dayjs from "dayjs";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ticketMessages, tickets } from "@/lib/db/schema";
import { PageShell } from "@/components/admin/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketInteractions } from "./_components/ticket-interactions";
import { requireCompanyContext } from "@/lib/permissions/mbac";

function getStatusBadge(status: string) {
  if (status === "aguardando") return <Badge variant="destructive">Aguardando</Badge>;
  if (status === "em_atendimento") {
    return <Badge className="bg-blue-500 hover:bg-blue-600">Em atendimento</Badge>;
  }
  if (status === "concluido") return <Badge variant="secondary">Concluido</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export default async function TicketDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const context = await requireCompanyContext();
  const { id } = await params;

  const ticket = await db.query.tickets.findFirst({
    where: and(
      eq(tickets.id, id),
      eq(tickets.applicationId, context.applicationId),
      eq(tickets.companyId, context.companyId),
    ),
    with: {
      application: true,
      company: true,
      user: true,
    },
  });

  if (!ticket) notFound();

  const messages = await db.query.ticketMessages.findMany({
    where: eq(ticketMessages.ticketId, id),
    orderBy: [asc(ticketMessages.createdAt)],
    with: {
      user: true,
    },
  });

  return (
    <PageShell
      title={`Chamado #${ticket.id.slice(0, 8)}`}
      description={ticket.title}
      action={getStatusBadge(ticket.status)}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="space-y-6 md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Descricao do chamado</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {ticket.description}
            </CardContent>
          </Card>

          <Card className="min-h-[420px]">
            <CardHeader>
              <CardTitle>Historico de respostas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem respostas registradas.</p>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="rounded-md border p-3">
                    <div className="mb-1 text-xs text-muted-foreground">
                      {message.user.name} ({message.user.email}) -{" "}
                      {dayjs(message.createdAt).format("DD/MM/YYYY HH:mm")}
                    </div>
                    <p className="text-sm">{message.content}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dados do chamado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Aplicacao: </span>
                <span>{ticket.application.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Empresa: </span>
                <span>{ticket.company.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Usuario: </span>
                <span>{ticket.user.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Email: </span>
                <span>{ticket.user.email}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Criado em: </span>
                <span>{dayjs(ticket.createdAt).format("DD/MM/YYYY HH:mm")}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Atualizado em: </span>
                <span>{dayjs(ticket.updatedAt).format("DD/MM/YYYY HH:mm")}</span>
              </div>
            </CardContent>
          </Card>

          <TicketInteractions
            ticketId={ticket.id}
            currentStatus={ticket.status as "aguardando" | "em_atendimento" | "concluido"}
          />
        </div>
      </div>
    </PageShell>
  );
}


