export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { db } from "@/lib/db";
import { companies } from "@/lib/db/schema";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyDetailsForm } from "./_components/company-details-form";
import { CompanyContracts } from "./_components/company-contracts";
import { CompanyPayments } from "./_components/company-payments";

export default async function CompanyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const company = await db.query.companies.findFirst({
    where: eq(companies.id, id),
    with: {
      application: true,
      contracts: true,
      payments: true,
    },
  });

  if (!company) {
    notFound();
  }

  return (
    <PageContainer>
      <div className="flex flex-col gap-4">
        <Button asChild variant="ghost" className="w-fit -ml-4 text-muted-foreground">
          <Link href="/dashboard/companies">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar para Empresas
          </Link>
        </Button>

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
          <p className="text-muted-foreground">
            Gestão da empresa, contratos e histórico financeiro.
          </p>
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="bg-zinc-100 p-1">
            <TabsTrigger value="details">Dados da Empresa</TabsTrigger>
            <TabsTrigger value="contracts">Contratos</TabsTrigger>
            <TabsTrigger value="payments">Pagamentos e Assinaturas</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="pt-4">
            <CompanyDetailsForm company={company} />
          </TabsContent>

          <TabsContent value="contracts" className="pt-4">
            <CompanyContracts companyId={company.id} contracts={company.contracts} />
          </TabsContent>

          <TabsContent value="payments" className="pt-4">
            <CompanyPayments companyId={company.id} payments={company.payments} />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
