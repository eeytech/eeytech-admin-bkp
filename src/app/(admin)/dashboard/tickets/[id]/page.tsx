import { asc, eq } from "drizzle-orm";
import dayjs from "dayjs";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ticketMessages, tickets } from "@/lib/db/schema";
import { PageShell } from "@/components/admin/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketInteractions } from "./_components/ticket-interactions";
import { requireModulePermission } from "@/lib/permissions/mbac";
import type { TicketStatus } from "@/lib/tickets/status";

function getStatusBadge(status: string) {
  if (status === "Aberto") return <Badge variant="destructive">Aberto</Badge>;
  if (status === "Em Atendimento") {
    return <Badge className="bg-blue-500 hover:bg-blue-600">Em atendimento</Badge>;
  }
  if (status === "Resolvido") return <Badge variant="secondary">Resolvido</Badge>;
  if (status === "Cancelado") return <Badge variant="outline">Cancelado</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export default async function TicketDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireModulePermission("tickets", "READ", "eeytech-admin");
  const { id } = await params;

  const ticket = await db.query.tickets.findFirst({
    where: eq(tickets.id, id),
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
      title={`Chamado: ${ticket.title}`}
      description={`Gerenciamento do chamado aberto por ${ticket.user.name}`}
      action={getStatusBadge(ticket.status)}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="space-y-6 md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Descrição do chamado</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {ticket.description}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de respostas</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[500px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem respostas registradas.</p>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="rounded-md border p-3">
                    <div className="mb-1 text-xs text-muted-foreground">
                      {message.user.name} ({message.user.email}) -{" "}
                      {dayjs(message.createdAt).format("DD/MM/YYYY HH:mm")}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
                <span className="text-muted-foreground">Aplicação: </span>
                <span>{ticket.application.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Empresa: </span>
                <span>{ticket.company.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Usuário: </span>
                <span>{ticket.user.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">E-mail: </span>
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
            currentStatus={ticket.status as TicketStatus}
          />
        </div>
      </div>
    </PageShell>
  );
}



