import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { applications } from "@/lib/db/schema";
import { PageShell } from "@/components/admin/page-shell";
import { CompaniesManager } from "./_components/companies-manager";

export default async function ApplicationCompaniesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const application = await db.query.applications.findFirst({
    where: eq(applications.id, id),
    with: {
      companies: {
        orderBy: (table, { asc }) => [asc(table.name)],
      },
    },
  });

  if (!application) {
    notFound();
  }

  return (
    <PageShell
      title={`Empresas de acesso - ${application.name}`}
      description="Crie, edite, ative, desative e exclua as empresas usadas no contexto de acesso desta aplicação."
    >
      <CompaniesManager
        applicationId={application.id}
        companies={application.companies.map((company) => ({
          id: company.id,
          name: company.name,
          cnpj: company.cnpj,
          status: company.status === "inactive" ? "inactive" : "active",
          createdAt: company.createdAt.toISOString(),
          updatedAt: company.updatedAt.toISOString(),
        }))}
      />
    </PageShell>
  );
}

