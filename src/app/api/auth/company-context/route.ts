import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyAccessToken, generateAccessToken } from "@/lib/auth/jwt";
import { validateCompanyAccessFromPayload } from "@/lib/auth/company-context";

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

  const body = await req.json();
  const companyId = String(body.companyId ?? "");

  if (!companyId) {
    return NextResponse.json({ error: "companyId obrigatorio" }, { status: 400 });
  }

  const allowed = await validateCompanyAccessFromPayload(payload, companyId);

  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const nextPayload = {
    ...payload,
    activeCompanyId: companyId,
  };

  const refreshedToken = generateAccessToken(nextPayload);

  const response = NextResponse.json({ success: true });
  response.cookies.set("auth_token", refreshedToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    domain: COOKIE_DOMAIN,
    path: "/",
  });

  return response;
}

