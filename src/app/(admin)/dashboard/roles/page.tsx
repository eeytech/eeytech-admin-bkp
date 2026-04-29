export const dynamic = "force-dynamic";

import { and, count, eq, ilike, or } from "drizzle-orm";
import Link from "next/link";

import { AutoSubmitForm } from "@/components/admin/auto-submit-form";
import { CreateRoleModal } from "@/components/admin/create-role-modal";
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
import { roles } from "@/lib/db/schema";

import { RoleActionsDropdown } from "./_components/role-actions-dropdown";

export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; applicationId?: string; page?: string }>;
}) {
  const filters = await searchParams;
  const q = (filters.q ?? "").trim();
  const applicationId = filters.applicationId ?? "all";
  const page = Math.max(1, parseInt(filters.page ?? "1"));
  const pageSize = 10;

  const whereConditions = [];
  if (q) {
    whereConditions.push(or(ilike(roles.name, `%${q}%`), ilike(roles.slug, `%${q}%`)));
  }
  if (applicationId !== "all") {
    whereConditions.push(eq(roles.applicationId, applicationId));
  }

  const finalWhere = whereConditions.length > 0 ? and(...whereConditions) : undefined;

  const [totalCountResult] = await db
    .select({ total: count() })
    .from(roles)
    .where(finalWhere);

  const totalRoles = totalCountResult?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalRoles / pageSize));
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * pageSize;

  const filteredRoles = await db.query.roles.findMany({
    where: finalWhere,
    with: {
      application: {
        with: { modules: true },
      },
      permissions: true,
    },
    limit: pageSize,
    offset,
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  });

  const startItem = totalRoles === 0 ? 0 : offset + 1;
  const endItem = totalRoles === 0 ? 0 : offset + filteredRoles.length;

  const allApps = await db.query.applications.findMany({
    orderBy: (table, { asc }) => [asc(table.name)],
  });

  return (
    <PageShell
      title="Gestão de Perfis"
      description="Gerencie perfis por aplicação e permissões por módulo."
      action={<CreateRoleModal applications={allApps} />}
    >
      <AutoSubmitForm
        className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:items-center"
      >
        <Input name="q" placeholder="Buscar por nome" defaultValue={q} className="h-9" />
        <select
          name="applicationId"
          defaultValue={applicationId}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">Todas as aplicações</option>
          {allApps.map((app) => (
            <option key={app.id} value={app.id}>
              {app.name}
            </option>
          ))}
        </select>
      </AutoSubmitForm>

      <div className="overflow-hidden rounded-md border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">Perfil</TableHead>
                <TableHead className="min-w-[150px]">Aplicação</TableHead>
                <TableHead>Módulos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Nenhum perfil encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="max-w-[150px] truncate">{role.name}</span>
                        <span className="font-mono text-[10px] uppercase text-muted-foreground">
                          {role.slug}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="whitespace-nowrap">
                        {role.application.name}
                      </Badge>
                    </TableCell>
                    <TableCell>{role.permissions.length}</TableCell>
                    <TableCell className="text-right">
                      <RoleActionsDropdown
                        roleId={role.id}
                        roleName={role.name}
                        modules={role.application.modules}
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
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </p>
          <p className="text-xs text-muted-foreground">
            Mostrando {startItem}-{endItem} de {totalRoles} perfis
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            asChild={currentPage > 1}
          >
            {currentPage > 1 ? (
              <Link
                href={`/dashboard/roles?page=${currentPage - 1}&q=${q}&applicationId=${applicationId}`}
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
            disabled={currentPage >= totalPages}
            asChild={currentPage < totalPages}
          >
            {currentPage < totalPages ? (
              <Link
                href={`/dashboard/roles?page=${currentPage + 1}&q=${q}&applicationId=${applicationId}`}
              >
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
