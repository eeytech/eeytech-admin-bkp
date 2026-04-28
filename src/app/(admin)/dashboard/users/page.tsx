export const dynamic = "force-dynamic";

import { and, desc, eq, ilike, or, count } from "drizzle-orm";
import dayjs from "dayjs";
import { Ban, CheckCircle } from "lucide-react";
import Link from "next/link";
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
  searchParams: Promise<{ q?: string; applicationId?: string; status?: string; page?: string }>;
}) {
  const filters = await searchParams;
  const q = (filters.q ?? "").trim();
  const filterApplicationId = filters.applicationId ?? "all";
  const filterStatus = filters.status ?? "all";
  const page = Math.max(1, parseInt(filters.page ?? "1"));
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  // Filtros
  const whereConditions = [];
  if (q) {
    whereConditions.push(
      or(
        ilike(users.name, `%${q}%`),
        ilike(users.email, `%${q}%`)
      )
    );
  }
  if (filterApplicationId !== "all") {
    whereConditions.push(eq(users.applicationId, filterApplicationId));
  }
  if (filterStatus !== "all") {
    whereConditions.push(eq(users.isActive, filterStatus === "active"));
  }

  const finalWhere = whereConditions.length > 0 ? and(...whereConditions) : undefined;

  // Busca de dados em paralelo
  const [totalCountResult, allApplications] = await Promise.all([
    db.select({ total: count() }).from(users).where(finalWhere),
    db.query.applications.findMany({
      with: {
        companies: {
          orderBy: (table, { asc }) => [asc(table.name)],
        },
        roles: {
          orderBy: (table, { asc }) => [asc(table.name)],
        },
      },
      orderBy: (table, { asc }) => [asc(table.name)],
    }),
  ]);

  const totalUsers = totalCountResult[0]?.total || 0;
  const totalPages = Math.ceil(totalUsers / pageSize);

  const filteredUsers = await db.query.users.findMany({
    where: finalWhere,
    with: {
      application: true,
      companies: {
        with: { company: true },
      },
    },
    limit: pageSize,
    offset: offset,
    orderBy: [desc(users.createdAt)],
  });

  const activeApplications = allApplications.filter((application) => application.isActive);
  if (activeApplications.length === 0) {
    activeApplications.push(...allApplications);
  }

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
      <form className="mb-4 grid grid-cols-1 gap-3 rounded-md border bg-card p-3 sm:grid-cols-2 lg:grid-cols-5">
        <Input name="q" placeholder="Buscar por nome ou email" defaultValue={q} />
        <select
          name="applicationId"
          defaultValue={filterApplicationId}
          className="rounded-md border border-input bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
          className="rounded-md border border-input bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="inactive">Desativados</option>
        </select>
        <div className="sm:col-span-2 lg:col-span-2 flex flex-col sm:flex-row justify-end gap-2">
          <Button type="submit" variant="outline" className="w-full sm:w-auto">
            Filtrar
          </Button>
          <Button asChild variant="ghost" className="w-full sm:w-auto">
            <a href="/dashboard/users">Limpar</a>
          </Button>
        </div>
      </form>

      <div className="rounded-md border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">Nome</TableHead>
                <TableHead className="min-w-[180px]">E-mail</TableHead>
                <TableHead className="min-w-[120px]">Aplicacao</TableHead>
                <TableHead className="min-w-[150px]">Empresas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="min-w-[100px]">Criado em</TableHead>
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
                    <TableCell className="truncate max-w-[180px]">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="whitespace-nowrap">{user.application.name}</Badge>
                    </TableCell>
                    <TableCell>
                      {user.isApplicationAdmin ? (
                        <Badge>Administrador Global</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {user.companies.length} empresa(s)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <Badge
                          variant="outline"
                          className="gap-1 border-green-200 bg-green-50 text-green-600 whitespace-nowrap"
                        >
                          <CheckCircle size={12} /> Ativo
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1 whitespace-nowrap">
                          <Ban size={12} /> Inativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
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
                    href={`/dashboard/users?page=${page - 1}&q=${q}&applicationId=${filterApplicationId}&status=${filterStatus}`}
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
                    href={`/dashboard/users?page=${page + 1}&q=${q}&applicationId=${filterApplicationId}&status=${filterStatus}`}
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
            Exibindo {offset + 1} a {Math.min(offset + pageSize, totalUsers)} de {totalUsers} usuário(s).
          </div>
        </div>
      )}
    </PageShell>
  );
}

