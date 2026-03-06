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

const STATUS_OPTIONS = [
  { value: "aguardando", label: "Aguardando" },
  { value: "em_atendimento", label: "Em atendimento" },
  { value: "concluido", label: "Concluído" },
];

function statusBadge(status: string) {
  if (status === "aguardando")
    return <Badge variant="destructive">Aguardando</Badge>;
  if (status === "em_atendimento") {
    return (
      <Badge className="bg-blue-500 hover:bg-blue-600">Em atendimento</Badge>
    );
  }
  if (status === "concluido")
    return <Badge variant="secondary">Concluído</Badge>;
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
      <form className="mb-4 grid grid-cols-1 gap-3 rounded-md border bg-card p-3 md:grid-cols-6">
        <div className="md:col-span-2">
          <Input
            name="q"
            placeholder="Buscar por título ou ID"
            defaultValue={q}
          />
        </div>

        <select
          name="applicationId"
          defaultValue={applicationId}
          className="rounded-md border bg-background p-2 text-sm"
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
          className="rounded-md border bg-background p-2 text-sm"
        >
          <option value="all">Todos os status</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <Input name="dateFrom" type="date" defaultValue={dateFrom} />
        <Input name="dateTo" type="date" defaultValue={dateTo} />

        <div className="md:col-span-6 flex justify-between items-center gap-2">
          <div className="text-xs text-muted-foreground">
            Exibindo {allTickets.length} chamado(s) encontrado(s).
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="outline">
              Filtrar
            </Button>
            <Button asChild variant="ghost">
              <a href="/dashboard/tickets">Limpar</a>
            </Button>
          </div>
        </div>
      </form>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Aplicação</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
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
                  Nenhum chamado encontrado no banco de dados.
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
                    <Badge variant="outline">
                      {ticket.application?.name ?? "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate">
                    {ticket.company?.name ?? "N/A"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">
                        {ticket.user?.name ?? "Desconhecido"}
                      </span>
                      <span className="text-[10px] text-muted-foreground line-clamp-1">
                        {ticket.user?.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{statusBadge(ticket.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
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
    </PageShell>
  );
}
