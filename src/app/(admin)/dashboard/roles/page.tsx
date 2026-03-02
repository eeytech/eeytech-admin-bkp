export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { PageShell } from "@/components/admin/page-shell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateRoleModal } from "@/components/admin/create-role-modal";
import { RolePermissionsButton } from "./_components/role-permissions-button";

export default async function RolesPage() {
  const allRoles = await db.query.roles.findMany({
    with: {
      application: {
        with: {
          modules: true,
        },
      },
      permissions: true,
    },
  });

  const allApps = await db.query.applications.findMany();

  return (
    <PageShell
      title="Permissoes e Papeis"
      description="Gerencie perfis de acesso (Roles) reutilizaveis para seus usuarios."
      action={<CreateRoleModal applications={allApps} />}
    >
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Papel</TableHead>
              <TableHead>Aplicacao</TableHead>
              <TableHead>Modulos</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allRoles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nenhum papel configurado.
                </TableCell>
              </TableRow>
            ) : (
              allRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{role.name}</span>
                      <span className="font-mono text-[10px] uppercase text-muted-foreground">
                        {role.slug}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{role.application.name}</TableCell>
                  <TableCell>{role.permissions.length} modulos</TableCell>
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
    </PageShell>
  );
}
