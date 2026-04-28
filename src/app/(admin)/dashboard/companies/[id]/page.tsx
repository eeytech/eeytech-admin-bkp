export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireModulePermission } from "@/lib/permissions/mbac";
import { db } from "@/lib/db";
import { companies } from "@/lib/db/schema";
import { CompanyContracts } from "./_components/company-contracts";
import { CompanyDetailsForm } from "./_components/company-details-form";
import { CompanyPayments } from "./_components/company-payments";

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

function getContractBadgeVariant(status?: string) {
  if (status === "Ativo") return "default";
  if (status === "Inadimplente") return "destructive";
  return "secondary";
}

export default async function CompanyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireModulePermission("companies", "READ", "eeytech-admin");

  const { id } = await params;

  const company = await db.query.companies.findFirst({
    where: eq(companies.id, id),
    with: {
      application: true,
      contracts: true,
      payments: {
        with: {
          contract: true,
        },
      },
    },
  });

  if (!company) {
    notFound();
  }

  const sortedContracts = [...company.contracts].sort(
    (left, right) =>
      new Date(right.startDate).getTime() - new Date(left.startDate).getTime(),
  );
  const sortedPayments = [...company.payments].sort(
    (left, right) =>
      new Date(right.dueDate).getTime() - new Date(left.dueDate).getTime(),
  );

  const activeContract = sortedContracts.find((contract) => contract.status === "Ativo");
  const contractedRevenue = sortedContracts
    .filter((contract) => contract.status === "Ativo")
    .reduce((total, contract) => total + Number(contract.amount), 0);
  const overduePayments = sortedPayments.filter((payment) => {
    if (payment.status === "Vencido") return true;
    return payment.status === "Pendente" && new Date(payment.dueDate) < new Date();
  });
  const overdueAmount = overduePayments.reduce(
    (total, payment) => total + Number(payment.amount),
    0,
  );

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <Button asChild variant="ghost" className="w-fit -ml-4 text-muted-foreground">
          <Link href="/dashboard/companies">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar para empresas
          </Link>
        </Button>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
            <p className="text-muted-foreground">
              Centralize os dados cadastrais, o contrato vigente e o histórico de
              recebimentos deste cliente.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{company.application?.name}</Badge>
            <Badge variant={company.status === "active" ? "default" : "secondary"}>
              {company.status === "active" ? "Cliente ativo" : "Cliente inativo"}
            </Badge>
            <Badge variant={getContractBadgeVariant(activeContract?.status)}>
              {activeContract ? `Contrato ${activeContract.status.toLowerCase()}` : "Sem contrato"}
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Contrato atual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">
                {activeContract?.title ?? "Nenhum contrato ativo"}
              </div>
              <p className="text-sm text-muted-foreground">
                {activeContract ? `Vence em ${new Date(activeContract.dueDate).toLocaleDateString("pt-BR")}` : "Cadastre um contrato para iniciar o ciclo financeiro"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Receita contratada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(contractedRevenue)}</div>
              <p className="text-sm text-muted-foreground">Soma dos contratos ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Recebíveis cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sortedPayments.length}</div>
              <p className="text-sm text-muted-foreground">
                {sortedPayments.length === 1 ? "1 lançamento" : `${sortedPayments.length} lançamentos`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Inadimplência</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(overdueAmount)}</div>
              <p className="text-sm text-muted-foreground">
                {overduePayments.length === 1
                  ? "1 pagamento em atraso"
                  : `${overduePayments.length} pagamentos em atraso`}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="bg-zinc-100 p-1">
            <TabsTrigger value="details">Dados da empresa</TabsTrigger>
            <TabsTrigger value="contracts">Contratos</TabsTrigger>
            <TabsTrigger value="payments">Receitas e pagamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="pt-4">
            <CompanyDetailsForm company={company} />
          </TabsContent>

          <TabsContent value="contracts" className="pt-4">
            <CompanyContracts companyId={company.id} contracts={sortedContracts} />
          </TabsContent>

          <TabsContent value="payments" className="pt-4">
            <CompanyPayments
              companyId={company.id}
              contracts={sortedContracts}
              payments={sortedPayments}
            />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
