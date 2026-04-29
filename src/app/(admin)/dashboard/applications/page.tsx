export const dynamic = "force-dynamic";

import { and, count, desc, eq, ilike } from "drizzle-orm";
import dayjs from "dayjs";
import Link from "next/link";

import { AutoSubmitForm } from "@/components/admin/auto-submit-form";
import { CreateAppModal } from "@/components/admin/create-app-modal";
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
import { db } from "@/lib/db";
import { applications } from "@/lib/db/schema";

import { ApplicationActions } from "./_components/application-actions";

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

  const whereConditions = [];
  if (q) {
    whereConditions.push(ilike(applications.name, `%${q}%`));
  }
  if (status !== "all") {
    whereConditions.push(eq(applications.isActive, status === "active"));
  }

  const finalWhere = whereConditions.length > 0 ? and(...whereConditions) : undefined;

  const [totalCountResult, filteredApplications] = await Promise.all([
    db.select({ total: count() }).from(applications).where(finalWhere),
    db.query.applications.findMany({
      where: finalWhere,
      with: { modules: true, companies: true },
      limit: pageSize,
      offset: (Math.max(1, page) - 1) * pageSize,
      orderBy: [desc(applications.createdAt)],
    }),
  ]);

  const totalApplications = totalCountResult[0]?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalApplications / pageSize));
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * pageSize;

  const pagedApplications =
    currentPage === page
      ? filteredApplications
      : await db.query.applications.findMany({
          where: finalWhere,
          with: { modules: true, companies: true },
          limit: pageSize,
          offset,
          orderBy: [desc(applications.createdAt)],
        });

  return (
    <PageShell
      title="Aplicações"
      description="Gerencie aplicações, empresas, módulos e disponibilidade."
      action={<CreateAppModal />}
    >
      <AutoSubmitForm
        className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:items-center"
      >
        <Input name="q" placeholder="Buscar por nome" defaultValue={q} className="h-9" />
        <select
          name="status"
          defaultValue={status}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">Todos os status</option>
          <option value="active">Ativas</option>
          <option value="inactive">Desativadas</option>
        </select>
      </AutoSubmitForm>

      <div className="overflow-hidden rounded-md border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">Nome</TableHead>
                <TableHead className="min-w-[120px]">Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Empresas</TableHead>
                <TableHead>Módulos</TableHead>
                <TableHead className="min-w-[120px]">Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Nenhuma aplicação encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                pagedApplications.map((app) => (
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

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Página {currentPage} de {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            asChild={currentPage > 1}
          >
            {currentPage > 1 ? (
              <Link href={`/dashboard/applications?page=${currentPage - 1}&q=${q}&status=${status}`}>
                Anterior
              </Link>
            ) : (
              <span>Anterior</span>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            asChild={currentPage < totalPages}
          >
            {currentPage < totalPages ? (
              <Link href={`/dashboard/applications?page=${currentPage + 1}&q=${q}&status=${status}`}>
                Próximo
              </Link>
            ) : (
              <span>Próximo</span>
            )}
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
