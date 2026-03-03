import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  applications,
  rolePermissions,
  roles,
  userRoles,
  users,
} from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getSystemSettings } from "@/lib/system-settings";
import { generateAccessToken } from "@/lib/auth/jwt";
import { resolveUserCompanyContext } from "@/lib/auth/company-context";

const COOKIE_DOMAIN = ".eeytech.com";

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}

export async function POST(request: Request) {
  try {
    const systemSettings = await getSystemSettings();
    const sessionTimeoutSeconds = systemSettings.sessionTimeoutMinutes * 60;

    const body = await request.json();
    const { email, password, applicationSlug, application_slug, companyId } = body;
    const requestedApplicationSlug = applicationSlug ?? application_slug;

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        name: users.name,
        applicationId: users.applicationId,
        isApplicationAdmin: users.isApplicationAdmin,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.email, email));

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Credenciais invalidas" },
        { status: 401 },
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Credenciais invalidas" },
        { status: 401 },
      );
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "Conta desativada" }, { status: 403 });
    }

    const [userApplication] = await db
      .select({
        id: applications.id,
        slug: applications.slug,
        isActive: applications.isActive,
      })
      .from(applications)
      .where(eq(applications.id, user.applicationId));

    if (!userApplication || !userApplication.isActive) {
      return NextResponse.json(
        { error: "Aplicacao do usuario inativa ou inexistente" },
        { status: 403 },
      );
    }

    if (
      requestedApplicationSlug &&
      requestedApplicationSlug !== userApplication.slug
    ) {
      return NextResponse.json(
        { error: "Usuario nao possui acesso a aplicacao solicitada" },
        { status: 403 },
      );
    }

    const companyContext = await resolveUserCompanyContext(
      {
        id: user.id,
        applicationId: user.applicationId,
        isApplicationAdmin: user.isApplicationAdmin,
      },
      companyId,
    );

    const roleBasedPermissions = await db
      .select({
        moduleSlug: rolePermissions.moduleSlug,
        actions: rolePermissions.actions,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .where(
        and(
          eq(userRoles.userId, user.id),
          eq(roles.applicationId, userApplication.id),
        ),
      );

    const modulesMap: Record<string, string[]> = {};
    roleBasedPermissions.forEach((permission) => {
      if (!modulesMap[permission.moduleSlug]) {
        modulesMap[permission.moduleSlug] = [];
      }

      modulesMap[permission.moduleSlug] = Array.from(
        new Set([...modulesMap[permission.moduleSlug], ...(permission.actions as string[])]),
      );
    });

    const fallbackName = user.name || user.email.split("@")[0];

    const accessToken = generateAccessToken(
      {
        sub: user.id,
        email: user.email,
        name: fallbackName,
        application: userApplication.slug,
        applicationId: userApplication.id,
        modules: modulesMap,
        isApplicationAdmin: user.isApplicationAdmin,
        companyIds: companyContext.companyIds,
        companies: companyContext.companies,
        activeCompanyId: companyContext.activeCompanyId,
      },
      sessionTimeoutSeconds,
    );

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: fallbackName,
        isApplicationAdmin: user.isApplicationAdmin,
      },
      context: {
        companies: companyContext.companies,
        activeCompanyId: companyContext.activeCompanyId,
      },
      system: {
        instanceName: systemSettings.instanceName,
        apiUrl: systemSettings.apiUrl,
        sessionTimeoutMinutes: systemSettings.sessionTimeoutMinutes,
      },
    });

    response.cookies.set("auth_token", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      domain: COOKIE_DOMAIN,
      path: "/",
      maxAge: sessionTimeoutSeconds,
    });

    const origin = request.headers.get("origin");
    if (origin) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
    }

    return response;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("sem acesso a empresas")) {
      return NextResponse.json(
        { error: "Usuario sem acesso a empresas ativas" },
        { status: 403 },
      );
    }

    console.error("Login Error:", error);
    return NextResponse.json(
      {
        error: "Erro interno no servidor",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

