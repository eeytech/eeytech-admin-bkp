export const dynamic = "force-dynamic";

import { and, desc, eq, ilike, or, count } from "drizzle-orm";
import dayjs from "dayjs";
import Link from "next/link";
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
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const filters = await searchParams;
  const q = (filters.q ?? "").trim();
  const status = filters.status ?? "all";
  const page = Math.max(1, parseInt(filters.page ?? "1"));
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  // Filtros
  const whereConditions = [];
  if (q) {
    whereConditions.push(ilike(applications.name, `%${q}%`));
  }
  if (status !== "all") {
    whereConditions.push(eq(applications.isActive, status === "active"));
  }

  const finalWhere = whereConditions.length > 0 ? and(...whereConditions) : undefined;

  // Busca de dados em paralelo
  const [totalCountResult, filteredApplications] = await Promise.all([
    db.select({ total: count() }).from(applications).where(finalWhere),
    db.query.applications.findMany({
      where: finalWhere,
      with: { modules: true, companies: true },
      limit: pageSize,
      offset: offset,
      orderBy: [desc(applications.createdAt)],
    })
  ]);

  const totalApplications = totalCountResult[0]?.total || 0;
  const totalPages = Math.ceil(totalApplications / pageSize);

  return (
    <PageShell
      title="Aplicacoes"
      description="Gerencie aplicacoes, empresas, modulos e disponibilidade."
      action={<CreateAppModal />}
    >
      <form className="mb-4 grid grid-cols-1 gap-3 rounded-md border bg-card p-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input name="q" placeholder="Buscar por nome" defaultValue={q} />
        <select
          name="status"
          defaultValue={status}
          className="rounded-md border border-input bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">Todos os status</option>
          <option value="active">Ativas</option>
          <option value="inactive">Desativadas</option>
        </select>
        <div className="sm:col-span-2 lg:col-span-2 flex flex-col sm:flex-row justify-end gap-2">
          <Button type="submit" variant="outline" className="w-full sm:w-auto">
            Filtrar
          </Button>
          <Button asChild variant="ghost" className="w-full sm:w-auto">
            <Link href="/dashboard/applications">Limpar</Link>
          </Button>
        </div>
      </form>

      <div className="rounded-md border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">Nome</TableHead>
                <TableHead className="min-w-[120px]">Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Empresas</TableHead>
                <TableHead>Modulos</TableHead>
                <TableHead className="min-w-[120px]">Criado em</TableHead>
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
                    href={`/dashboard/applications?page=${page - 1}&q=${q}&status=${status}`}
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
                    href={`/dashboard/applications?page=${page + 1}&q=${q}&status=${status}`}
                  >
                    Próximo
                  </Link>
                ) : (
                  <span>Próximo</span>
                )}
              </Button>
            </div>
          </div>
          <div className="text-xs text-muted-foreground text-center border-t pt-4">
            Exibindo {offset + 1} a {Math.min(offset + pageSize, totalApplications)} de {totalApplications} aplicação(ões).
          </div>
        </div>
      )}
    </PageShell>
  );
}

