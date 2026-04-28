export const dynamic = "force-dynamic";

import { count, desc, eq, ilike, or } from "drizzle-orm";
import dayjs from "dayjs";
import { Eye, Search } from "lucide-react";
import Link from "next/link";

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
import { applications, companies } from "@/lib/db/schema";
import { CreateCompanyModal } from "./_components/create-company-modal";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const search = (q ?? "").trim();
  const page = Math.max(1, parseInt(pageParam ?? "1"));
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  const whereClause = search
    ? or(
        ilike(companies.name, `%${search}%`),
        ilike(companies.cnpj, `%${search}%`),
        ilike(companies.email, `%${search}%`),
      )
    : undefined;

  const [totalCountResult, allCompanies, apps] = await Promise.all([
    db.select({ total: count() }).from(companies).where(whereClause),
    db.query.companies.findMany({
      where: whereClause,
      with: {
        application: true,
      },
      limit: pageSize,
      offset,
      orderBy: [desc(companies.createdAt)],
    }),
    db
      .select({ id: applications.id, name: applications.name })
      .from(applications)
      .where(eq(applications.isActive, true)),
  ]);

  const totalCompanies = totalCountResult[0]?.total || 0;
  const totalPages = Math.ceil(totalCompanies / pageSize);

  return (
    <PageShell
      title="Empresas (Clientes)"
      description="Gerencie a carteira comercial da eeyTech com contratos, recebíveis e relacionamento financeiro."
      action={<CreateCompanyModal applications={apps} />}
    >
      <div className="mb-4 flex items-center gap-2">
        <form className="relative w-full max-w-sm flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Buscar cliente, CNPJ ou e-mail..."
            className="pl-8"
            defaultValue={search}
          />
        </form>
      </div>

      <div className="overflow-hidden rounded-md border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Cliente</TableHead>
                <TableHead className="min-w-[150px]">CNPJ</TableHead>
                <TableHead className="min-w-[140px]">Aplicação principal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="min-w-[100px]">Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                allCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-zinc-900">{company.name}</span>
                        <span className="max-w-[180px] truncate text-xs text-muted-foreground">
                          {company.email || "Sem e-mail"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {company.cnpj || "---"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="whitespace-nowrap">
                        {company.application?.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={company.status === "active" ? "default" : "secondary"}>
                        {company.status === "active" ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {dayjs(company.createdAt).format("DD/MM/YYYY")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="icon">
                        <Link href={`/dashboard/companies/${company.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Abrir ficha CRM</span>
                        </Link>
                      </Button>
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
              <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
                {page > 1 ? (
                  <Link href={`/dashboard/companies?page=${page - 1}&q=${search}`}>
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
                  <Link href={`/dashboard/companies?page=${page + 1}&q=${search}`}>
                    Próximo
                  </Link>
                ) : (
                  <span>Próximo</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
