export const dynamic = "force-dynamic";

import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import dayjs from "dayjs";
import { Ban, CheckCircle } from "lucide-react";
import Link from "next/link";

import { AutoSubmitForm } from "@/components/admin/auto-submit-form";
import { CreateUserModal } from "@/components/admin/create-user-modal";
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
import { users } from "@/lib/db/schema";

import { UserActions } from "./_components/user-actions";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    applicationId?: string;
    status?: string;
    page?: string;
  }>;
}) {
  const filters = await searchParams;
  const q = (filters.q ?? "").trim();
  const filterApplicationId = filters.applicationId ?? "all";
  const filterStatus = filters.status ?? "all";
  const page = Math.max(1, parseInt(filters.page ?? "1"));
  const pageSize = 10;

  const whereConditions = [];
  if (q) {
    whereConditions.push(or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`)));
  }
  if (filterApplicationId !== "all") {
    whereConditions.push(eq(users.applicationId, filterApplicationId));
  }
  if (filterStatus !== "all") {
    whereConditions.push(eq(users.isActive, filterStatus === "active"));
  }

  const finalWhere = whereConditions.length > 0 ? and(...whereConditions) : undefined;

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
  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * pageSize;

  const filteredUsers = await db.query.users.findMany({
    where: finalWhere,
    with: {
      application: true,
      companies: {
        with: { company: true },
      },
    },
    limit: pageSize,
    offset,
    orderBy: [desc(users.createdAt)],
  });

  const startItem = totalUsers === 0 ? 0 : offset + 1;
  const endItem = totalUsers === 0 ? 0 : offset + filteredUsers.length;

  const activeApplications = allApplications.filter((application) => application.isActive);
  if (activeApplications.length === 0) {
    activeApplications.push(...allApplications);
  }

  return (
    <PageShell
      title="Gestão de Usuários"
      description="Usuários pertencem a uma aplicação, usam perfis e possuem escopo por empresas."
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
      <AutoSubmitForm
        className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-7 xl:items-center"
      >
        <div className="sm:col-span-2 xl:col-span-3">
          <Input
            name="q"
            placeholder="Buscar por nome ou e-mail"
            defaultValue={q}
            className="h-9"
          />
        </div>
        <select
          name="applicationId"
          defaultValue={filterApplicationId}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring xl:col-span-2"
        >
          <option value="all">Todas as aplicações</option>
          {allApplications.map((application) => (
            <option key={application.id} value={application.id}>
              {application.name}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={filterStatus}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring xl:col-span-2"
        >
          <option value="all">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="inactive">Desativados</option>
        </select>
      </AutoSubmitForm>

      <div className="overflow-hidden rounded-md border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">Nome</TableHead>
                <TableHead className="min-w-[180px]">E-mail</TableHead>
                <TableHead className="min-w-[120px]">Aplicação</TableHead>
                <TableHead className="min-w-[150px]">Empresas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="min-w-[100px]">Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="max-w-[180px] truncate">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="whitespace-nowrap">
                        {user.application.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.isApplicationAdmin ? (
                        <Badge>Administrador Global</Badge>
                      ) : (
                        <span className="whitespace-nowrap text-sm text-muted-foreground">
                          {user.companies.length} empresa(s)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <Badge
                          variant="outline"
                          className="gap-1 whitespace-nowrap border-green-200 bg-green-50 text-green-600"
                        >
                          <CheckCircle size={12} /> Ativo
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1 whitespace-nowrap">
                          <Ban size={12} /> Inativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
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

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </p>
          <p className="text-xs text-muted-foreground">
            Mostrando {startItem}-{endItem} de {totalUsers} usuários
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
                href={`/dashboard/users?page=${currentPage - 1}&q=${q}&applicationId=${filterApplicationId}&status=${filterStatus}`}
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
                href={`/dashboard/users?page=${currentPage + 1}&q=${q}&applicationId=${filterApplicationId}&status=${filterStatus}`}
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
