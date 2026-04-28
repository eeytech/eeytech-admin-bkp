import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { getSystemSettings } from "@/lib/system-settings";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const systemSettings = await getSystemSettings();

  return NextResponse.json({
    authenticated: true,
    session: {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      application: payload.application,
      applicationId: payload.applicationId,
      isApplicationAdmin: payload.isApplicationAdmin,
      companies: payload.companies,
      activeCompanyId: payload.activeCompanyId,
    },
    system: {
      instanceName: systemSettings.instanceName,
      apiUrl: systemSettings.apiUrl,
      sessionTimeoutMinutes: systemSettings.sessionTimeoutMinutes,
    },
  });
}

