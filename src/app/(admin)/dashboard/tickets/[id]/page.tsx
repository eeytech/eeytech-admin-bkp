import { db } from "@/lib/db";
import { tickets, ticketMessages, users } from "@/lib/db/schema";
import { PageShell } from "@/components/admin/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import dayjs from "dayjs"; // Conforme regra do projeto
import { Send, Clock, AlertCircle, CheckCircle2 } from "lucide-react";

export default async function TicketDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;

  // 1. Buscar Ticket e Mensagens
  const ticket = await db.query.tickets.findFirst({
    where: eq(tickets.id, id),
    with: {
      application: true,
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
      title={`Chamado #${ticket.id.substring(0, 8)}`}
      description={ticket.subject}
      action={
        <Badge variant={ticket.status === "OPEN" ? "destructive" : "secondary"}>
          {ticket.status}
        </Badge>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Coluna de Mensagens */}
        <div className="md:col-span-3 space-y-6">
          <Card className="min-h-[500px] flex flex-col">
            <CardContent className="flex-1 p-6 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="flex flex-col space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">
                      {msg.user
                        ? (msg.user as any).email
                        : "Usuário desconhecido"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {dayjs(msg.createdAt).format("DD/MM/YYYY HH:mm")}
                    </span>
                  </div>
                  <div className="bg-muted p-3 rounded-lg text-sm max-w-[80%]">
                    {msg.content}
                  </div>
                </div>
              ))}
            </CardContent>

            <div className="p-4 border-t bg-card">
              <form className="space-y-3">
                <Textarea
                  placeholder="Escreva sua resposta..."
                  className="min-h-[100px] resize-none"
                />
                <div className="flex justify-end">
                  <Button className="gap-2">
                    <Send size={16} /> Enviar Resposta
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>

        {/* Painel Lateral de Info */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold border-b pb-2">Detalhes</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <AlertCircle size={14} /> Prioridade:
                  </span>
                  <Badge variant="outline">{ticket.priority}</Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Clock size={14} /> Aberto em:
                  </span>
                  <span>{dayjs(ticket.createdAt).format("DD/MM/YYYY")}</span>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start text-blue-500"
                >
                  <Clock className="mr-2 h-4 w-4" /> Marcar Em Progresso
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-green-600"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Fechar Chamado
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
