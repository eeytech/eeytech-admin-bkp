import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  users,
  userRoles,
  roles,
  rolePermissions,
  applications,
  userModulePermissions,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "12345";
const COOKIE_DOMAIN = ".eeytech.com";

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*", // Em produção, ideal listar os domínios permitidos
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, applicationSlug, application_slug } = body;
    const requestedApplicationSlug = applicationSlug ?? application_slug;

    // 1. Busca o usuário pelo e-mail
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 },
      );
    }

    // 2. Valida a senha
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 },
      );
    }

    let modulesMap: Record<string, string[]> = {};
    let targetAppSlug = requestedApplicationSlug || "eeytech-admin"; // Default para o próprio Admin

    // 3. Busca permissões para a app alvo (roles + permissões diretas).
    const [app] = await db
      .select()
      .from(applications)
      .where(eq(applications.slug, targetAppSlug));

    if (app) {
      const roleBasedPermissions = await db
        .select({
          moduleSlug: rolePermissions.moduleSlug,
          actions: rolePermissions.actions,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
        .where(and(eq(userRoles.userId, user.id), eq(roles.applicationId, app.id)));

      const directPermissions = await db
        .select({
          moduleSlug: userModulePermissions.moduleSlug,
          actions: userModulePermissions.actions,
        })
        .from(userModulePermissions)
        .where(
          and(
            eq(userModulePermissions.userId, user.id),
            eq(userModulePermissions.applicationId, app.id),
          ),
        );

      [...roleBasedPermissions, ...directPermissions].forEach((p) => {
        if (!modulesMap[p.moduleSlug]) modulesMap[p.moduleSlug] = [];
        modulesMap[p.moduleSlug] = Array.from(
          new Set([...modulesMap[p.moduleSlug], ...(p.actions as string[])]),
        );
      });
    }

    // 4. Gera o Token JWT
    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        application: targetAppSlug,
        modules: modulesMap,
      },
      JWT_SECRET,
      { expiresIn: "1h" }, // Tempo maior para o Admin
    );

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
    });

    // 5. Configura o Cookie (Centralizado no domínio pai)
    response.cookies.set("auth_token", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      domain: COOKIE_DOMAIN,
      path: "/",
      maxAge: 60 * 60, // 1 hora
    });

    // Adiciona cabeçalhos de CORS dinâmicos baseados na origem da requisição
    const origin = request.headers.get("origin");
    if (origin) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
    }

    return response;
  } catch (error: any) {
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
