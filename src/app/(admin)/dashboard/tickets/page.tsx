export const dynamic = "force-dynamic";

import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
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

const STATUS_OPTIONS = [
  { value: "aguardando", label: "Aguardando" },
  { value: "em_atendimento", label: "Em atendimento" },
  { value: "concluido", label: "Concluido" },
];

function statusLabel(status: string) {
  return STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

function statusBadge(status: string) {
  if (status === "aguardando") return <Badge variant="destructive">Aguardando</Badge>;
  if (status === "em_atendimento") {
    return <Badge className="bg-blue-500 hover:bg-blue-600">Em atendimento</Badge>;
  }
  if (status === "concluido") return <Badge variant="secondary">Concluido</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    applicationId?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  const filters = await searchParams;
  const q = (filters.q ?? "").trim();
  const status = filters.status ?? "all";
  const applicationId = filters.applicationId ?? "all";
  const userId = filters.userId ?? "all";
  const dateFrom = filters.dateFrom ?? "";
  const dateTo = filters.dateTo ?? "";

  const where = [];

  if (status !== "all") where.push(eq(tickets.status, status));
  if (applicationId !== "all") where.push(eq(tickets.applicationId, applicationId));
  if (userId !== "all") where.push(eq(tickets.userId, userId));
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

  const [allTickets, allApps, allUsers] = await Promise.all([
    db.query.tickets.findMany({
      where: where.length > 0 ? and(...where) : undefined,
      with: {
        application: true,
        user: true,
      },
      orderBy: [desc(tickets.createdAt)],
    }),
    db.query.applications.findMany({
      orderBy: (table, { asc }) => [asc(table.name)],
    }),
    db.query.users.findMany({
      orderBy: (table, { asc }) => [asc(table.name)],
    }),
  ]);

  return (
    <PageShell
      title="Chamados"
      description="Visualize, filtre e responda chamados dos SaaS."
    >
      <form className="mb-4 grid grid-cols-1 gap-3 rounded-md border bg-card p-3 md:grid-cols-6">
        <Input name="q" placeholder="Buscar por titulo ou ID" defaultValue={q} />
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
        <select
          name="applicationId"
          defaultValue={applicationId}
          className="rounded-md border bg-background p-2 text-sm"
        >
          <option value="all">Todas as aplicacoes</option>
          {allApps.map((app) => (
            <option key={app.id} value={app.id}>
              {app.name}
            </option>
          ))}
        </select>
        <select
          name="userId"
          defaultValue={userId}
          className="rounded-md border bg-background p-2 text-sm"
        >
          <option value="all">Todos os usuarios</option>
          {allUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>
        <Input name="dateFrom" type="date" defaultValue={dateFrom} />
        <Input name="dateTo" type="date" defaultValue={dateTo} />
        <div className="md:col-span-6 flex justify-end gap-2">
          <Button type="submit" variant="outline">
            Filtrar
          </Button>
          <Button asChild variant="ghost">
            <a href="/dashboard/tickets">Limpar</a>
          </Button>
        </div>
      </form>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Titulo</TableHead>
              <TableHead>Aplicacao</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
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
                    #{ticket.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="max-w-[280px] truncate">
                    {ticket.title}
                  </TableCell>
                  <TableCell>{ticket.application.name}</TableCell>
                  <TableCell>
                    {ticket.user.name}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({ticket.user.email})
                    </span>
                  </TableCell>
                  <TableCell>{statusBadge(ticket.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {dayjs(ticket.createdAt).format("DD/MM/YYYY HH:mm")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm" className="gap-2">
                      <Link href={`/dashboard/tickets/${ticket.id}`}>
                        <MessageSquare size={16} />
                        Visualizar
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-3 text-xs text-muted-foreground">
        Status disponiveis: {STATUS_OPTIONS.map((option) => statusLabel(option.value)).join(", ")}.
      </div>
    </PageShell>
  );
}
