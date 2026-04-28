export const dynamic = "force-dynamic";

import { desc, ilike, or, eq } from "drizzle-orm";
import dayjs from "dayjs";
import Link from "next/link";
import { Eye, Search } from "lucide-react";

import { db } from "@/lib/db";
import { companies, applications } from "@/lib/db/schema";
import { PageContainer } from "@/components/layout/page-container";
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
import { Badge } from "@/components/ui/badge";
import { CreateCompanyModal } from "./_components/create-company-modal";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const search = (q ?? "").trim();

  const whereClause = search
    ? or(
        ilike(companies.name, `%${search}%`),
        ilike(companies.cnpj, `%${search}%`),
        ilike(companies.email, `%${search}%`)
      )
    : undefined;

  const allCompanies = await db.query.companies.findMany({
    where: whereClause,
    with: {
      application: true,
    },
    orderBy: [desc(companies.createdAt)],
  });

  const apps = await db.select({ id: applications.id, name: applications.name })
    .from(applications)
    .where(eq(applications.isActive, true));

  return (
    <PageContainer>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Empresas</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seus clientes, contratos e pagamentos.
          </p>
        </div>
        <div className="w-full md:w-auto">
          <CreateCompanyModal applications={apps} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <form className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Buscar empresa, CNPJ ou e-mail..."
            className="pl-8"
            defaultValue={search}
          />
        </form>
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Empresa</TableHead>
                <TableHead className="min-w-[150px]">CNPJ</TableHead>
                <TableHead className="min-w-[120px]">Aplicação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="min-w-[100px]">Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allCompanies.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Nenhuma empresa encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                allCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-zinc-900">{company.name}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[180px]">
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
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {dayjs(company.createdAt).format("DD/MM/YYYY")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="icon">
                        <Link href={`/dashboard/companies/${company.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Ver detalhes</span>
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
    </PageContainer>
  );
}
