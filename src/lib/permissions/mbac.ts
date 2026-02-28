import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { redirect } from "next/navigation";

const SUPER_ADMIN_EMAIL =
  (process.env.SUPER_ADMIN_EMAIL ?? "admin@eeytech.com.br").toLowerCase();

export async function getSessionPermissions() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  return verifyAccessToken(token);
}

export async function requireModulePermission(
  moduleSlug: string,
  action: string,
  applicationSlug?: string
) {
  const payload = await getSessionPermissions();

  if (!payload) redirect("/login");

  // Bypass de Super Admin
  if (payload.email.toLowerCase() === SUPER_ADMIN_EMAIL) {
    return payload;
  }

  // Validação de contexto de aplicação para o SaaS
  if (applicationSlug && payload.application !== applicationSlug) {
    throw new Error("Acesso negado: Token inválido para esta aplicação");
  }

  const userActions = payload.modules[moduleSlug] || [];
  
  const hasPermission =
    userActions.includes("FULL") || userActions.includes(action);

  if (!hasPermission) {
    throw new Error(`Permissão insuficiente para o módulo ${moduleSlug}`);
  }

  return payload;
}
