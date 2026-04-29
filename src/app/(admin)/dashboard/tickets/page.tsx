export const dynamic = "force-dynamic";

import { and, desc, eq, gte, ilike, lte, or, sql, count } from "drizzle-orm";
import dayjs from "dayjs";
import Link from "next/link";
import { db } from "@/lib/db";
import { applications, tickets, users } from "@/lib/db/schema";
import { PageShell } from "@/components/admin/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MessageSquare } from "lucide-react";
import { requireModulePermission } from "@/lib/permissions/mbac";
import { TICKET_STATUSES } from "@/lib/tickets/status";
import { TicketFilters } from "./_components/ticket-filters";

const STATUS_OPTIONS = TICKET_STATUSES.map((status) => ({
  value: status,
  label: status,
}));

function statusBadge(status: string) {
  if (status === "Aberto") return <Badge variant="destructive">Aberto</Badge>;
  if (status === "Em Atendimento") {
    return (
      <Badge className="bg-blue-500 hover:bg-blue-600">Em atendimento</Badge>
    );
  }
  if (status === "Resolvido")
    return <Badge variant="secondary">Resolvido</Badge>;
  if (status === "Cancelado") return <Badge variant="outline">Cancelado</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    userId?: string;
    applicationId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }>;
}) {
  // Apenas verificamos se o usuário tem permissão de leitura de tickets no sistema central
  await requireModulePermission("tickets", "READ", "eeytech-admin");

  const filters = await searchParams;
  const q = (filters.q ?? "").trim();
  const status = filters.status ?? "all";
  const userId = filters.userId ?? "all";
  const applicationId = filters.applicationId ?? "all";
  const dateFrom = filters.dateFrom ?? "";
  const dateTo = filters.dateTo ?? "";
  const page = Math.max(1, parseInt(filters.page ?? "1"));
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  // Filtros
  const whereConditions = [];
  if (status !== "all") whereConditions.push(eq(tickets.status, status));
  if (userId !== "all") whereConditions.push(eq(tickets.userId, userId));
  if (applicationId !== "all")
    whereConditions.push(eq(tickets.applicationId, applicationId));

  if (dateFrom)
    whereConditions.push(gte(tickets.createdAt, new Date(dateFrom)));
  if (dateTo) {
    const endOfDay = new Date(dateTo);
    endOfDay.setHours(23, 59, 59, 999);
    whereConditions.push(lte(tickets.createdAt, endOfDay));
  }

  if (q) {
    whereConditions.push(
      or(
        ilike(tickets.title, `%${q}%`),
        sql`CAST(${tickets.id} AS TEXT) ILIKE ${`%${q}%`}`,
      )!,
    );
  }

  const finalWhere =
    whereConditions.length > 0 ? and(...whereConditions) : undefined;

  // Busca de dados em paralelo
  const [totalCountResult, allUsers, allApplications] = await Promise.all([
    db.select({ total: count() }).from(tickets).where(finalWhere),
    db.query.users.findMany({
      orderBy: (table, { asc }) => [asc(table.name)],
    }),
    db.query.applications.findMany({
      orderBy: (table, { asc }) => [asc(table.name)],
    }),
  ]);

  const totalTickets = totalCountResult[0]?.total || 0;
  const totalPages = Math.ceil(totalTickets / pageSize);

  const filteredTickets = await db.query.tickets.findMany({
    where: finalWhere,
    with: {
      application: true,
      company: true,
      user: true,
    },
    limit: pageSize,
    offset: offset,
    orderBy: [desc(tickets.createdAt)],
  });

  return (
    <PageShell
      title="Gestão de Chamados"
      description="Visualize e gerencie todos os tickets de suporte de todas as aplicações e empresas."
    >
      <TicketFilters
        initialFilters={{ q, status, userId, applicationId, dateFrom, dateTo }}
        users={allUsers}
        applications={allApplications}
      />

      <div className="rounded-md border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Aplicação</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px]">Criado em</TableHead>
                <TableHead className="w-[80px] text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Nenhum chamado encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">
                      {ticket.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{ticket.application.name}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {ticket.company?.name || "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {ticket.user?.name || "Desconhecido"}
                    </TableCell>
                    <TableCell>{statusBadge(ticket.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {dayjs(ticket.createdAt).format("DD/MM/YYYY HH:mm")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="icon" variant="ghost">
                        <Link href={`/dashboard/tickets/${ticket.id}`}>
                          <MessageSquare className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                asChild={page > 1}
              >
                {page > 1 ? (
                  <Link
                    href={`/dashboard/tickets?page=${page - 1}&q=${q}&status=${status}&userId=${userId}&applicationId=${applicationId}&dateFrom=${dateFrom}&dateTo=${dateTo}`}
                  >
                    Anterior
                  </Link>
                ) : (
                  <span>Anterior</span>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                asChild={page < totalPages}
              >
                {page < totalPages ? (
                  <Link
                    href={`/dashboard/tickets?page=${page + 1}&q=${q}&status=${status}&userId=${userId}&applicationId=${applicationId}&dateFrom=${dateFrom}&dateTo=${dateTo}`}
                  >
                    Próximo
                  </Link>
                ) : (
                  <span>Próximo</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
