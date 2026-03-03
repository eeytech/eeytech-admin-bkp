export const dynamic = "force-dynamic";

import { desc } from "drizzle-orm";
import dayjs from "dayjs";
import { db } from "@/lib/db";
import { applications } from "@/lib/db/schema";
import { PageShell } from "@/components/admin/page-shell";
import { CreateAppModal } from "@/components/admin/create-app-modal";
import { ApplicationActions } from "./_components/application-actions";
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

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const filters = await searchParams;
  const q = (filters.q ?? "").trim().toLowerCase();
  const status = filters.status ?? "all";

  const allApplications = await db.query.applications.findMany({
    with: { modules: true, companies: true },
    orderBy: [desc(applications.createdAt)],
  });

  const filteredApplications = allApplications.filter((app) => {
    const matchName = !q || app.name.toLowerCase().includes(q);
    const matchStatus =
      status === "all" ||
      (status === "active" && app.isActive) ||
      (status === "inactive" && !app.isActive);

    return matchName && matchStatus;
  });

  return (
    <PageShell
      title="Aplicacoes"
      description="Gerencie aplicacoes, empresas, modulos e disponibilidade."
      action={<CreateAppModal />}
    >
      <form className="mb-4 grid grid-cols-1 gap-3 rounded-md border bg-card p-3 md:grid-cols-4">
        <Input name="q" placeholder="Buscar por nome" defaultValue={q} />
        <select
          name="status"
          defaultValue={status}
          className="rounded-md border bg-background p-2 text-sm"
        >
          <option value="all">Todos os status</option>
          <option value="active">Ativas</option>
          <option value="inactive">Desativadas</option>
        </select>
        <div className="md:col-span-2 flex justify-end gap-2">
          <Button type="submit" variant="outline">
            Filtrar
          </Button>
          <Button asChild variant="ghost">
            <a href="/dashboard/applications">Limpar</a>
          </Button>
        </div>
      </form>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Empresas</TableHead>
              <TableHead>Modulos</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApplications.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nenhuma aplicacao encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredApplications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {app.slug}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={app.isActive ? "default" : "secondary"}>
                      {app.isActive ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell>{app.companies.length}</TableCell>
                  <TableCell>{app.modules.length}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {dayjs(app.createdAt).format("DD/MM/YYYY")}
                  </TableCell>
                  <TableCell className="text-right">
                    <ApplicationActions
                      app={{
                        id: app.id,
                        name: app.name,
                        slug: app.slug,
                        isActive: app.isActive,
                        modules: app.modules.map((module) => ({
                          id: module.id,
                          name: module.name,
                          slug: module.slug,
                        })),
                      }}
                    />
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

