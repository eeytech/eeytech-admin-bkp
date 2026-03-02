export const dynamic = "force-dynamic";

import { SettingsForm } from "./_components/settings-form";
import { getSystemSettings } from "@/lib/system-settings";

export default async function SettingsPage() {
  const settings = await getSystemSettings();

  const initialData = {
    name: settings.instanceName,
    url: settings.apiUrl,
    sessionTimeout: String(settings.sessionTimeoutMinutes),
  };

  return <SettingsForm initialData={initialData} />;
}
