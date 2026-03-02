import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { applications } from "@/lib/db/schema";
import { PageShell } from "@/components/admin/page-shell";
import { ApplicationSettingsForm } from "./_components/application-settings-form";

export default async function ApplicationSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const application = await db.query.applications.findFirst({
    where: eq(applications.id, id),
  });

  if (!application) {
    notFound();
  }

  return (
    <PageShell
      title={`Configuracoes - ${application.name}`}
      description="Atualize os dados completos da aplicacao."
    >
      <ApplicationSettingsForm
        initialData={{
          id: application.id,
          name: application.name,
          slug: application.slug,
          apiKey: application.apiKey,
          isActive: application.isActive,
        }}
      />
    </PageShell>
  );
}
