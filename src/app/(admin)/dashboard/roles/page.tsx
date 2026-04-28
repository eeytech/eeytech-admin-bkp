export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { PageShell } from "@/components/admin/page-shell";
import { CreateRoleModal } from "@/components/admin/create-role-modal";
import { RolePermissionsButton } from "./_components/role-permissions-button";
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

export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; applicationId?: string }>;
}) {
  const filters = await searchParams;
  const q = (filters.q ?? "").trim().toLowerCase();
  const applicationId = filters.applicationId ?? "all";

  const allRoles = await db.query.roles.findMany({
    with: {
      application: {
        with: { modules: true },
      },
      permissions: true,
    },
  });
  const allApps = await db.query.applications.findMany({
    orderBy: (table, { asc }) => [asc(table.name)],
  });

  const filteredRoles = allRoles.filter((role) => {
    const matchName =
      !q ||
      role.name.toLowerCase().includes(q) ||
      role.slug.toLowerCase().includes(q);
    const matchApplication =
      applicationId === "all" || role.applicationId === applicationId;
    return matchName && matchApplication;
  });

  return (
    <PageShell
      title="Perfis"
      description="Gerencie perfis por aplicacao e permissoes por modulo."
      action={<CreateRoleModal applications={allApps} />}
    >
      <form className="mb-4 grid grid-cols-1 gap-3 rounded-md border bg-card p-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input name="q" placeholder="Buscar por nome" defaultValue={q} />
        <select
          name="applicationId"
          defaultValue={applicationId}
          className="rounded-md border border-input bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">Todas as aplicacoes</option>
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
            <a href="/dashboard/roles">Limpar</a>
          </Button>
        </div>
      </form>

      <div className="rounded-md border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">Perfil</TableHead>
                <TableHead className="min-w-[150px]">Aplicacao</TableHead>
                <TableHead>Modulos</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
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
                      <RolePermissionsButton
                        roleId={role.id}
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
    </PageShell>
  );
}
