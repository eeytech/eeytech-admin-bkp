import { db } from "@/lib/db";

const DEFAULT_INSTANCE_NAME = "Admin Eeytech";
const DEFAULT_API_URL = "https://api.eeytech.com.br";
const DEFAULT_SESSION_TIMEOUT_MINUTES = 15;
const MAX_SESSION_TIMEOUT_MINUTES = 24 * 60;

export type ResolvedSystemSettings = {
  instanceName: string;
  apiUrl: string;
  sessionTimeoutMinutes: number;
};

export function parseSessionTimeoutMinutes(
  value: string | number | null | undefined,
): number {
  const numericValue = typeof value === "number" ? value : Number(value);
  const timeout = Math.trunc(numericValue);

  if (!Number.isFinite(timeout) || timeout < 1) {
    return DEFAULT_SESSION_TIMEOUT_MINUTES;
  }

  return Math.min(timeout, MAX_SESSION_TIMEOUT_MINUTES);
}

export async function getSystemSettings(): Promise<ResolvedSystemSettings> {
  const settings = await db.query.systemSettings.findFirst();

  return {
    instanceName: settings?.instanceName ?? DEFAULT_INSTANCE_NAME,
    apiUrl: settings?.apiUrl ?? DEFAULT_API_URL,
    sessionTimeoutMinutes: parseSessionTimeoutMinutes(settings?.sessionTimeout),
  };
}
