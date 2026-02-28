export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { applications } from "@/lib/db/schema";
import { PageShell } from "@/components/admin/page-shell";
import { CreateAppModal } from "@/components/admin/create-app-modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { desc } from "drizzle-orm";
import dayjs from "dayjs"; // Conforme regra do general.mdc
import { ApplicationActions } from "./_components/application-actions";

export default async function ApplicationsPage() {
  // Busca as aplicações diretamente no servidor
  const allApplications = await db.query.applications.findMany({
    orderBy: [desc(applications.createdAt)],
  });

  return (
    <PageShell
      title="Aplicações"
      description="Gerencie as instâncias de SaaS conectadas ao ecossistema Eeytech."
      action={<CreateAppModal />}
    >
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>API Key</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allApplications.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nenhuma aplicação cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              allApplications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {app.slug}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs text-muted-foreground bg-muted px-1 py-0.5 rounded">
                      {app.apiKey.substring(0, 8)}...
                    </code>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {dayjs(app.createdAt).format("DD/MM/YYYY")}
                  </TableCell>
                  <TableCell className="text-right">
                    {/* Componente que contém o dropdown de opções e o botão de copiar */}
                    <ApplicationActions app={app} />
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
