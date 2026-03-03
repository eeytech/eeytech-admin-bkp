import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { redirect } from "next/navigation";
import { validateCompanyAccessFromPayload } from "@/lib/auth/company-context";

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
  applicationSlug?: string,
) {
  const payload = await getSessionPermissions();

  if (!payload) redirect("/login");

  if (payload.email.toLowerCase() === SUPER_ADMIN_EMAIL) {
    return payload;
  }

  if (applicationSlug && payload.application !== applicationSlug) {
    throw new Error("Acesso negado: token invalido para esta aplicacao");
  }

  const userActions = payload.modules[moduleSlug] || [];
  const hasPermission =
    userActions.includes("FULL") || userActions.includes(action);

  if (!hasPermission) {
    throw new Error(`Permissao insuficiente para o modulo ${moduleSlug}`);
  }

  return payload;
}

export async function requireCompanyContext(options?: {
  applicationId?: string;
  companyId?: string;
}) {
  const payload = await getSessionPermissions();

  if (!payload) redirect("/login");

  const companyId = options?.companyId ?? payload.activeCompanyId;

  if (!companyId) {
    throw new Error("Contexto de empresa nao informado");
  }

  if (options?.applicationId && payload.applicationId !== options.applicationId) {
    throw new Error("Aplicacao invalida para a sessao");
  }

  const allowed = await validateCompanyAccessFromPayload(payload, companyId);

  if (!allowed) {
    const err = new Error("Unauthorized");
    (err as Error & { status?: number }).status = 403;
    throw err;
  }

  return {
    payload,
    companyId,
    applicationId: payload.applicationId,
  };
}

