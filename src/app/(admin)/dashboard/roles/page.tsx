export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { roles, applications } from "@/lib/db/schema";
import { PageShell } from "@/components/admin/page-shell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button"; // Importação adicionada para corrigir o erro
import { CreateRoleModal } from "@/components/admin/create-role-modal";

export default async function RolesPage() {
  // Busca papéis com relações
  const allRoles = await db.query.roles.findMany({
    with: {
      application: true,
      permissions: true,
    },
  });

  const allApps = await db.query.applications.findMany();

  return (
    <PageShell
      title="Permissões e Papéis"
      description="Gerencie perfis de acesso (Roles) reutilizáveis para seus usuários."
      action={<CreateRoleModal applications={allApps} />}
    >
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Papel</TableHead>
              <TableHead>Aplicação</TableHead>
              <TableHead>Módulos</TableHead>
              <TableHead className="text-right">Ações</TableHead>
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
                      <span className="text-[10px] text-muted-foreground uppercase font-mono">
                        {role.slug}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{role.application.name}</TableCell>
                  <TableCell>{role.permissions.length} módulos</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      Gerenciar Permissões
                    </Button>
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
