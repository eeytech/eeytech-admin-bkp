import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyAccessToken, generateAccessToken } from "@/lib/auth/jwt";
import { resolveUserCompanyContext } from "@/lib/auth/company-context";
import { getSystemSettings } from "@/lib/system-settings";

const COOKIE_DOMAIN = ".eeytech.com";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    return NextResponse.json({ error: "Token invalido" }, { status: 401 });
  }

  let body: { companyId?: unknown };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisicao invalido" }, { status: 400 });
  }

  const companyId = typeof body.companyId === "string" ? body.companyId : "";

  if (!companyId) {
    return NextResponse.json({ error: "companyId obrigatorio" }, { status: 400 });
  }

  let companyContext;

  try {
    companyContext = await resolveUserCompanyContext(
      {
        id: payload.sub,
        applicationId: payload.applicationId,
        isApplicationAdmin: payload.isApplicationAdmin,
      },
      companyId,
    );
  } catch {
    return NextResponse.json({ error: "Usuario sem acesso a empresas ativas" }, { status: 403 });
  }

  if (companyContext.activeCompanyId !== companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const systemSettings = await getSystemSettings();
  const sessionTimeoutSeconds = systemSettings.sessionTimeoutMinutes * 60;

  const nextPayload = {
    ...payload,
    companyIds: companyContext.companyIds,
    companies: companyContext.companies,
    activeCompanyId: companyContext.activeCompanyId,
    activeClinicId: companyContext.activeCompanyId,
  };

  const refreshedToken = generateAccessToken(nextPayload, sessionTimeoutSeconds);

  const response = NextResponse.json({
    success: true,
    context: {
      activeCompanyId: companyContext.activeCompanyId,
      activeClinicId: companyContext.activeCompanyId,
      companies: companyContext.companies,
    },
  });

  response.cookies.set("auth_token", refreshedToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    domain: COOKIE_DOMAIN,
    path: "/",
    maxAge: sessionTimeoutSeconds,
  });

  return response;
}