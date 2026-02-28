export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { tickets, applications } from "@/lib/db/schema";
import { PageShell } from "@/components/admin/page-shell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { desc } from "drizzle-orm";
import Link from "next/link";
import dayjs from "dayjs"; // Conforme regra do projeto
import { MessageSquare, Clock, Filter } from "lucide-react";

export default async function TicketsPage() {
  // Busca chamados com relação com a aplicação para mostrar o nome do SaaS
  const allTickets = await db.query.tickets.findMany({
    orderBy: [desc(tickets.createdAt)],
    with: {
      application: true,
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return <Badge variant="destructive">Aberto</Badge>;
      case "IN_PROGRESS":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">Em Progresso</Badge>
        );
      case "CLOSED":
        return <Badge variant="secondary">Fechado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "text-red-600 font-bold";
      case "MEDIUM":
        return "text-amber-600";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <PageShell
      title="Chamados de Suporte"
      description="Visualize e responda solicitações de suporte de todas as aplicações."
      action={
        <Button variant="outline" size="sm" className="gap-2">
          <Filter size={16} /> Filtrar
        </Button>
      }
    >
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Aplicação</TableHead>
              <TableHead>Assunto</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allTickets.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nenhum chamado encontrado.
                </TableCell>
              </TableRow>
            ) : (
              allTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    #{ticket.id.substring(0, 8)}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-sm">
                      {/* Use o encadeamento opcional e um fallback */}
                      {(ticket as any).application?.name || "Sem Aplicação"}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {ticket.subject}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs ${getPriorityColor(ticket.priority)}`}
                    >
                      {ticket.priority}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {dayjs(ticket.createdAt).format("DD/MM/YYYY HH:mm")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm" className="gap-2">
                      <Link href={`/dashboard/tickets/${ticket.id}`}>
                        <MessageSquare size={16} />
                        Responder
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </PageShell>
  );
}
