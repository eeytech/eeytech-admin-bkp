export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { SettingsForm } from "./_components/settings-form";

export default async function SettingsPage() {
  // Busca a primeira (e única) linha de configurações
  const settings = await db.query.systemSettings.findFirst();

  // Dados iniciais (com fallback caso o banco esteja vazio)
  const initialData = {
    name: settings?.instanceName ?? "Admin Eeytech",
    url: settings?.apiUrl ?? "https://api.eeytech.com.br",
    sessionTimeout: settings?.sessionTimeout ?? "15",
  };

  return <SettingsForm initialData={initialData} />;
}
