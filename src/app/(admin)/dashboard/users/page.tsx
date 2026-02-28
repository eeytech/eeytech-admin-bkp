export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { PageShell } from "@/components/admin/page-shell";
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
import dayjs from "dayjs";
import { Ban, CheckCircle } from "lucide-react";

import { CreateUserModal } from "@/components/admin/create-user-modal";
import { UserActions } from "./_components/user-actions";

export default async function UsersPage() {
  // 1. Busca usuários
  const allUsers = await db.query.users.findMany({
    orderBy: [desc(users.createdAt)],
  });

  // 2. Busca todas as aplicações e seus módulos para o gerenciamento de permissões
  const allApplications = await db.query.applications.findMany({
    with: {
      modules: true,
    },
  });

  return (
    <PageShell
      title="Gestão de Usuários"
      description="Administre as contas de acesso e permissões do ecossistema Eeytech."
      action={<CreateUserModal />}
    >
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>E-mail</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nenhum usuário cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              allUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    {user.isActive ? (
                      <Badge
                        variant="outline"
                        className="text-green-600 border-green-200 bg-green-50 gap-1"
                      >
                        <CheckCircle size={12} /> Ativo
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <Ban size={12} /> Inativo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {dayjs(user.createdAt).format("DD/MM/YYYY")}
                  </TableCell>
                  <TableCell className="text-right">
                    {/* Passamos as aplicações para o componente de ações */}
                    <UserActions user={user} applications={allApplications} />
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
