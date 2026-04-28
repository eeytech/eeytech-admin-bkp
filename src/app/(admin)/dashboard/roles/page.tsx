export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { PageShell } from "@/components/admin/page-shell";
import { CreateRoleModal } from "@/components/admin/create-role-modal";
import { RolePermissionsButton } from "./_components/role-permissions-button";
import { RoleDeleteButton } from "./_components/role-delete-button";
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
import { and, ilike, or, eq, count } from "drizzle-orm";
import { roles } from "@/lib/db/schema";
import Link from "next/link";

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
  const offset = (page - 1) * pageSize;

  const whereConditions = [];
  if (q) {
    whereConditions.push(
      or(ilike(roles.name, `%${q}%`), ilike(roles.slug, `%${q}%`))
    );
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
  const totalPages = Math.ceil(totalRoles / pageSize);

  const filteredRoles = await db.query.roles.findMany({
    where: finalWhere,
    with: {
      application: {
        with: { modules: true },
      },
      permissions: true,
    },
    limit: pageSize,
    offset: offset,
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  });

  const allApps = await db.query.applications.findMany({
    orderBy: (table, { asc }) => [asc(table.name)],
  });

  return (
    <PageShell
      title="Perfis"
      description="Gerencie perfis por aplicação e permissões por módulo."
      action={<CreateRoleModal applications={allApps} />}
    >
      <form className="mb-4 grid grid-cols-1 gap-3 rounded-md border bg-card p-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input name="q" placeholder="Buscar por nome" defaultValue={q} />
        <select
          name="applicationId"
          defaultValue={applicationId}
          className="rounded-md border border-input bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">Todas as aplicações</option>
          {allApps.map((app) => (
            <option key={app.id} value={app.id}>
              {app.name}
            </option>
          ))}
        </select>
        <div className="sm:col-span-2 lg:col-span-2 flex flex-col sm:flex-row justify-end gap-2">
          <Button type="submit" variant="outline" className="w-full sm:w-auto">
            Filtrar
          </Button>
          <Button asChild variant="ghost" className="w-full sm:w-auto">
            <Link href="/dashboard/roles">Limpar</Link>
          </Button>
        </div>
      </form>

      <div className="rounded-md border bg-card overflow-hidden">
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
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Nenhum perfil encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="truncate max-w-[150px]">{role.name}</span>
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
                      <div className="flex items-center justify-end gap-2">
                        <RolePermissionsButton
                          roleId={role.id}
                          modules={role.application.modules}
                        />
                        <RoleDeleteButton roleId={role.id} roleName={role.name} />
                      </div>
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
                    href={`/dashboard/roles?page=${page - 1}&q=${q}&applicationId=${applicationId}`}
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
                    href={`/dashboard/roles?page=${page + 1}&q=${q}&applicationId=${applicationId}`}
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
            Exibindo {offset + 1} a {Math.min(offset + pageSize, totalRoles)} de {totalRoles} perfis.
          </div>
        </div>
      )}
    </PageShell>
  );
}

