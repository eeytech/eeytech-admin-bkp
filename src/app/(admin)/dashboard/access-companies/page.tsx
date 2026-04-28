export const dynamic = "force-dynamic";

import dayjs from "dayjs";
import { count, desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { Building2, ShieldCheck } from "lucide-react";

import { PageShell } from "@/components/admin/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/db";
import { applications, companies, userCompanies } from "@/lib/db/schema";
import { requireModulePermission } from "@/lib/permissions/mbac";

export default async function AccessCompaniesPage() {
  await requireModulePermission("companies", "READ", "eeytech-admin");

  const [rows, [totalRow], [activeRow], [linkedUsersRow], appsWithCompanies] =
    await Promise.all([
      db
        .select({
          id: companies.id,
          name: companies.name,
          cnpj: companies.cnpj,
          status: companies.status,
          createdAt: companies.createdAt,
          applicationId: applications.id,
          applicationName: applications.name,
          linkedUsers: sql<number>`count(${userCompanies.userId})`,
        })
        .from(companies)
        .innerJoin(applications, eq(companies.applicationId, applications.id))
        .leftJoin(userCompanies, eq(userCompanies.companyId, companies.id))
        .groupBy(
          companies.id,
          companies.name,
          companies.cnpj,
          companies.status,
          companies.createdAt,
          applications.id,
          applications.name,
        )
        .orderBy(desc(companies.createdAt)),
      db.select({ total: count() }).from(companies),
      db
        .select({ total: count() })
        .from(companies)
        .where(eq(companies.status, "active")),
      db.select({ total: count() }).from(userCompanies),
      db
        .selectDistinct({
          applicationId: applications.id,
        })
        .from(companies)
        .innerJoin(applications, eq(companies.applicationId, applications.id)),
    ]);

  return (
    <PageShell
      title="Empresas de acesso"
      description="Gerencie as empresas vinculadas às aplicações para contexto de login, permissões e escopo de usuários."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Empresas vinculadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Number(totalRow?.total ?? 0)}</div>
            <p className="text-sm text-muted-foreground">
              Total de empresas no domínio de acesso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Empresas ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Number(activeRow?.total ?? 0)}</div>
            <p className="text-sm text-muted-foreground">
              Disponíveis para autenticação e contexto ativo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vínculos de usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Number(linkedUsersRow?.total ?? 0)}</div>
            <p className="text-sm text-muted-foreground">
              {appsWithCompanies.length} aplicações com empresas vinculadas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 rounded-md border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Aplicação</TableHead>
                <TableHead>Status de acesso</TableHead>
                <TableHead>Usuários vinculados</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nenhuma empresa de acesso encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-zinc-900">{row.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {row.cnpj || "Sem CNPJ informado"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="whitespace-nowrap">
                        {row.applicationName}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.status === "active" ? "default" : "secondary"}>
                        {row.status === "active" ? "Ativa para acesso" : "Inativa para acesso"}
                      </Badge>
                    </TableCell>
                    <TableCell>{Number(row.linkedUsers)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {dayjs(row.createdAt).format("DD/MM/YYYY")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/dashboard/applications/${row.applicationId}/companies`}>
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Gerenciar acesso
                          </Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/dashboard/companies/${row.id}`}>
                            <Building2 className="mr-2 h-4 w-4" />
                            Abrir CRM
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/70 p-4 text-sm text-muted-foreground">
        As empresas desta área definem o escopo operacional das aplicações e o contexto
        de acesso dos usuários. Para contratos, pagamentos e relacionamento comercial,
        use a área de <Link href="/dashboard/companies" className="font-medium text-primary hover:underline">Empresas (Clientes)</Link>.
      </div>
    </PageShell>
  );
}
