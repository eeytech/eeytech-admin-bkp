export const dynamic = "force-dynamic";

import dayjs from "dayjs";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { applications, roles, tickets, users } from "@/lib/db/schema";
import { PageShell } from "@/components/admin/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardCharts } from "./_components/dashboard-charts";

function statusLabel(status: string) {
  if (status === "aguardando") return "Aguardando";
  if (status === "em_atendimento") return "Em atendimento";
  if (status === "concluido") return "Concluido";
  return status;
}

function statusColor(status: string) {
  if (status === "aguardando") return "#ef4444";
  if (status === "em_atendimento") return "#3b82f6";
  if (status === "concluido") return "#22c55e";
  return "#94a3b8";
}

export default async function DashboardPage() {
  const [
    [appCount],
    [userCount],
    [roleCount],
    [ticketCount],
    statusRows,
    appRows,
    recentTickets,
    recentApps,
    ticketsLast30Days,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(applications),
    db.select({ count: sql<number>`count(*)` }).from(users),
    db.select({ count: sql<number>`count(*)` }).from(roles),
    db.select({ count: sql<number>`count(*)` }).from(tickets),
    db
      .select({
        status: tickets.status,
        count: sql<number>`count(*)`,
      })
      .from(tickets)
      .groupBy(tickets.status),
    db
      .select({
        applicationName: applications.name,
        count: sql<number>`count(*)`,
      })
      .from(tickets)
      .innerJoin(applications, eq(tickets.applicationId, applications.id))
      .groupBy(applications.name),
    db.query.tickets.findMany({
      with: { application: true, user: true },
      where: eq(tickets.status, "aguardando"),
      orderBy: [desc(tickets.createdAt)],
      limit: 5,
    }),
    db.query.applications.findMany({
      orderBy: [desc(applications.createdAt)],
      limit: 5,
    }),
    db.query.tickets.findMany({
      columns: { createdAt: true },
      where: (table, { gte }) =>
        gte(table.createdAt, dayjs().subtract(29, "day").startOf("day").toDate()),
      orderBy: [desc(tickets.createdAt)],
    }),
  ]);

  const statusMap = new Map(statusRows.map((row) => [row.status, Number(row.count)]));
  const byStatus = ["aguardando", "em_atendimento", "concluido"].map((status) => ({
    status: statusLabel(status),
    total: statusMap.get(status) ?? 0,
    color: statusColor(status),
  }));

  const byApp = appRows
    .map((row) => ({ name: row.applicationName, total: Number(row.count) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const periodMap = new Map<string, number>();
  for (let i = 29; i >= 0; i -= 1) {
    const key = dayjs().subtract(i, "day").format("DD/MM");
    periodMap.set(key, 0);
  }
  ticketsLast30Days.forEach((ticket) => {
    const key = dayjs(ticket.createdAt).format("DD/MM");
    periodMap.set(key, (periodMap.get(key) ?? 0) + 1);
  });
  const byPeriod = Array.from(periodMap.entries()).map(([day, total]) => ({ day, total }));

  const cards = [
    { title: "Total de Aplicacoes", value: Number(appCount.count) },
    { title: "Total de Usuarios", value: Number(userCount.count) },
    { title: "Total de Perfis", value: Number(roleCount.count) },
    { title: "Total de Chamados", value: Number(ticketCount.count) },
    { title: "Chamados Abertos", value: statusMap.get("aguardando") ?? 0 },
    { title: "Chamados Em Atendimento", value: statusMap.get("em_atendimento") ?? 0 },
    { title: "Chamados Concluidos", value: statusMap.get("concluido") ?? 0 },
  ];

  return (
    <PageShell title="Dashboard" description="Visao estrategica do ambiente admin.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4">
        <DashboardCharts byStatus={byStatus} byApp={byApp} byPeriod={byPeriod} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ultimos 5 chamados abertos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem chamados recentes.</p>
            ) : (
              recentTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-start justify-between border-b pb-2">
                  <div>
                    <p className="text-sm font-medium">{ticket.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {ticket.application.name} • {ticket.user.name}
                    </p>
                  </div>
                  <Badge variant="outline">{statusLabel(ticket.status)}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ultimas aplicacoes criadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentApps.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem aplicacoes recentes.</p>
            ) : (
              recentApps.map((app) => (
                <div key={app.id} className="flex items-start justify-between border-b pb-2">
                  <div>
                    <p className="text-sm font-medium">{app.name}</p>
                    <p className="text-xs text-muted-foreground">{app.slug}</p>
                  </div>
                  <Badge variant={app.isActive ? "default" : "secondary"}>
                    {app.isActive ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
