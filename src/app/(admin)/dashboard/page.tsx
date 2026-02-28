export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { users, applications, tickets } from "@/lib/db/schema";
import { PageShell } from "@/components/admin/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Globe, Ticket, Activity } from "lucide-react";
import { sql } from "drizzle-orm";

export default async function DashboardPage() {
  // Busca contagens rápidas para o dashboard
  const [userCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users);
  const [appCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(applications);
  const [ticketCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(tickets);

  const stats = [
    {
      title: "Total de Usuários",
      value: userCount.count.toString(),
      icon: Users,
      description: "Contas registradas no ecossistema",
    },
    {
      title: "Aplicações",
      value: appCount.count.toString(),
      icon: Globe,
      description: "Instâncias de SaaS ativas",
    },
    {
      title: "Chamados Abertos",
      value: ticketCount.count.toString(),
      icon: Ticket,
      description: "Suporte técnico pendente",
    },
    {
      title: "Status do Sistema",
      value: "Operacional",
      icon: Activity,
      description: "Todos os serviços online",
    },
  ];

  return (
    <PageShell
      title="Dashboard"
      description="Visão geral do ecossistema Eeytech."
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Aqui você pode adicionar gráficos ou atividades recentes futuramente */}
      <div className="mt-8 p-8 border rounded-lg border-dashed flex items-center justify-center text-muted-foreground">
        Gráficos de atividade e logs recentes serão exibidos aqui.
      </div>
    </PageShell>
  );
}
