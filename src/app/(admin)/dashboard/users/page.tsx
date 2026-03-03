export const dynamic = "force-dynamic";

import { desc } from "drizzle-orm";
import dayjs from "dayjs";
import { Ban, CheckCircle } from "lucide-react";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { PageShell } from "@/components/admin/page-shell";
import { CreateUserModal } from "@/components/admin/create-user-modal";
import { UserActions } from "./_components/user-actions";
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

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; applicationId?: string; status?: string }>;
}) {
  const filters = await searchParams;
  const q = (filters.q ?? "").trim().toLowerCase();
  const filterApplicationId = filters.applicationId ?? "all";
  const filterStatus = filters.status ?? "all";

  const allUsers = await db.query.users.findMany({
    with: {
      application: true,
      companies: {
        with: { company: true },
      },
    },
    orderBy: [desc(users.createdAt)],
  });
  const allApplications = await db.query.applications.findMany({
    with: {
      companies: {
        orderBy: (table, { asc }) => [asc(table.name)],
      },
      roles: {
        orderBy: (table, { asc }) => [asc(table.name)],
      },
    },
    orderBy: (table, { asc }) => [asc(table.name)],
  });

  const activeApplications = allApplications.filter((application) => application.isActive);
  if (activeApplications.length === 0) {
    activeApplications.push(...allApplications);
  }

  const filteredUsers = allUsers.filter((user) => {
    const matchText =
      !q ||
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q);
    const matchApplication =
      filterApplicationId === "all" || user.applicationId === filterApplicationId;
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && user.isActive) ||
      (filterStatus === "inactive" && !user.isActive);
    return matchText && matchApplication && matchStatus;
  });

  return (
    <PageShell
      title="Gestao de Usuarios"
      description="Usuarios pertencem a uma aplicacao, usam perfis e possuem escopo por empresas."
      action={
        <CreateUserModal
          applications={activeApplications.map((application) => ({
            id: application.id,
            name: application.name,
            companies: application.companies.map((company) => ({
              id: company.id,
              name: company.name,
              status: company.status,
            })),
            roles: application.roles.map((role) => ({
              id: role.id,
              name: role.name,
              slug: role.slug,
            })),
          }))}
        />
      }
    >
      <form className="mb-4 grid grid-cols-1 gap-3 rounded-md border bg-card p-3 md:grid-cols-5">
        <Input name="q" placeholder="Buscar por nome ou email" defaultValue={q} />
        <select
          name="applicationId"
          defaultValue={filterApplicationId}
          className="rounded-md border bg-background p-2 text-sm"
        >
          <option value="all">Todas as aplicacoes</option>
          {allApplications.map((application) => (
            <option key={application.id} value={application.id}>
              {application.name}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={filterStatus}
          className="rounded-md border bg-background p-2 text-sm"
        >
          <option value="all">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="inactive">Desativados</option>
        </select>
        <div className="md:col-span-2 flex justify-end gap-2">
          <Button type="submit" variant="outline">
            Filtrar
          </Button>
          <Button asChild variant="ghost">
            <a href="/dashboard/users">Limpar</a>
          </Button>
        </div>
      </form>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Aplicacao</TableHead>
              <TableHead>Empresas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nenhum usuario encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.application.name}</Badge>
                  </TableCell>
                  <TableCell>
                    {user.isApplicationAdmin ? (
                      <Badge>Administrador Global</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {user.companies.length} empresa(s)
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.isActive ? (
                      <Badge
                        variant="outline"
                        className="gap-1 border-green-200 bg-green-50 text-green-600"
                      >
                        <CheckCircle size={12} /> Ativo
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <Ban size={12} /> Inativo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {dayjs(user.createdAt).format("DD/MM/YYYY")}
                  </TableCell>
                  <TableCell className="text-right">
                    <UserActions
                      user={{
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        isActive: user.isActive,
                        applicationId: user.applicationId,
                        applicationName: user.application.name,
                        isApplicationAdmin: user.isApplicationAdmin,
                        companyIds: user.companies.map((entry) => entry.companyId),
                      }}
                      applications={allApplications.map((application) => ({
                        id: application.id,
                        name: application.name,
                        companies: application.companies.map((company) => ({
                          id: company.id,
                          name: company.name,
                          status: company.status,
                        })),
                        roles: application.roles.map((role) => ({
                          id: role.id,
                          name: role.name,
                          slug: role.slug,
                          applicationId: role.applicationId,
                        })),
                      }))}
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

