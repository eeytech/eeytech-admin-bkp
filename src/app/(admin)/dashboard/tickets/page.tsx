export const dynamic = "force-dynamic";

import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import dayjs from "dayjs";
import Link from "next/link";
import { db } from "@/lib/db";
import { applications, companies, tickets, users } from "@/lib/db/schema";
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
  if (status === "Resolvido") return <Badge variant="secondary">Resolvido</Badge>;
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

  // Começamos sem filtros obrigatórios para exibir TUDO por padrão
  const where = [];

  // Aplicamos filtros apenas se forem selecionados na interface
  if (status !== "all") where.push(eq(tickets.status, status));
  if (userId !== "all") where.push(eq(tickets.userId, userId));
  if (applicationId !== "all")
    where.push(eq(tickets.applicationId, applicationId));

  if (dateFrom) where.push(gte(tickets.createdAt, new Date(dateFrom)));
  if (dateTo) {
    const endOfDay = new Date(dateTo);
    endOfDay.setHours(23, 59, 59, 999);
    where.push(lte(tickets.createdAt, endOfDay));
  }

  if (q) {
    where.push(
      or(
        ilike(tickets.title, `%${q}%`),
        sql`CAST(${tickets.id} AS TEXT) ILIKE ${`%${q}%`}`,
      )!,
    );
  }

  // Buscamos todos os chamados, usuários e aplicações para os filtros do topo
  const [allTickets, allUsers, allApplications] = await Promise.all([
    db.query.tickets.findMany({
      where: where.length > 0 ? and(...where) : undefined,
      with: {
        application: true,
        company: true,
        user: true,
      },
      orderBy: [desc(tickets.createdAt)],
    }),
    db.query.users.findMany({
      orderBy: (table, { asc }) => [asc(table.name)],
    }),
    db.query.applications.findMany({
      orderBy: (table, { asc }) => [asc(table.name)],
    }),
  ]);

  return (
    <PageShell
      title="Gestão Global de Chamados"
      description="Visualize e gerencie todos os tickets de suporte de todas as aplicações e empresas."
    >
      <form className="mb-4 grid grid-cols-1 gap-3 rounded-md border bg-card p-3 sm:grid-cols-2 lg:grid-cols-7">
        <div className="sm:col-span-2 lg:col-span-2">
          <Input
            name="q"
            placeholder="Buscar por título ou ID"
            defaultValue={q}
          />
        </div>

        <select
          name="applicationId"
          defaultValue={applicationId}
          className="rounded-md border border-input bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">Todas as aplicações</option>
          {allApplications.map((app) => (
            <option key={app.id} value={app.id}>
              {app.name}
            </option>
          ))}
        </select>

        <select
          name="status"
          defaultValue={status}
          className="rounded-md border border-input bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">Todos os status</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          name="userId"
          defaultValue={userId}
          className="rounded-md border border-input bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">Todos os usuários</option>
          {allUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>

        <Input name="dateFrom" type="date" defaultValue={dateFrom} />
        <Input name="dateTo" type="date" defaultValue={dateTo} />

        <div className="sm:col-span-2 lg:col-span-7 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-xs text-muted-foreground order-2 sm:order-1">
            Exibindo {allTickets.length} chamado(s) encontrado(s).
          </div>
          <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-2">
            <Button type="submit" variant="outline" className="flex-1 sm:flex-none">
              Filtrar
            </Button>
            <Button asChild variant="ghost" className="flex-1 sm:flex-none">
              <a href="/dashboard/tickets">Limpar</a>
            </Button>
          </div>
        </div>
      </form>

      <div className="rounded-md border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[100px]">ID</TableHead>
                <TableHead className="min-w-[200px]">Título</TableHead>
                <TableHead className="min-w-[120px]">Aplicação</TableHead>
                <TableHead className="min-w-[150px]">Empresa</TableHead>
                <TableHead className="min-w-[180px]">Usuário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="min-w-[150px]">Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allTickets.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Nenhum chamado encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                allTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      #{ticket.id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate font-medium">
                      {ticket.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="whitespace-nowrap">
                        {ticket.application?.name ?? "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {ticket.company?.name ?? "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm truncate max-w-[150px]">
                          {ticket.user?.name ?? "Desconhecido"}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                          {ticket.user?.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{statusBadge(ticket.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {dayjs(ticket.createdAt).format("DD/MM/YYYY HH:mm")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm" className="gap-2">
                        <Link href={`/dashboard/tickets/${ticket.id}`}>
                          <MessageSquare size={16} />
                          Ver
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
    </PageShell>
  );
}
