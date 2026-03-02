import { db } from "@/lib/db";
import {
  applications,
  rolePermissions,
  roles,
  sessions,
  userRoles,
  users,
} from "@/lib/db/schema";
import { generateAccessToken } from "@/lib/auth/jwt";
import { getSystemSettings } from "@/lib/system-settings";
import { and, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const systemSettings = await getSystemSettings();
    const { refreshToken } = await req.json();

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!,
    ) as { sub: string };

    const session = await db.query.sessions.findFirst({
      where: and(
        eq(sessions.token, refreshToken),
        eq(sessions.userId, decoded.sub),
        gt(sessions.expiresAt, new Date()),
      ),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Sessao invalida ou expirada" },
        { status: 401 },
      );
    }

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        isActive: users.isActive,
        applicationId: users.applicationId,
      })
      .from(users)
      .where(eq(users.id, decoded.sub));

    if (!user) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 401 });
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

    const permissions = await db
      .select({
        moduleSlug: rolePermissions.moduleSlug,
        actions: rolePermissions.actions,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .where(
        and(
          eq(userRoles.userId, decoded.sub),
          eq(roles.applicationId, userApplication.id),
        ),
      );

    const moduleMap: Record<string, string[]> = {};
    permissions.forEach((permission) => {
      if (!moduleMap[permission.moduleSlug]) {
        moduleMap[permission.moduleSlug] = [];
      }
      moduleMap[permission.moduleSlug] = Array.from(
        new Set([
          ...moduleMap[permission.moduleSlug],
          ...(permission.actions as string[]),
        ]),
      );
    });

    const accessToken = generateAccessToken(
      {
        sub: decoded.sub,
        email: user.email,
        application: userApplication.slug,
        modules: moduleMap,
      },
      systemSettings.sessionTimeoutMinutes * 60,
    );

    return NextResponse.json({ accessToken });
  } catch {
    return NextResponse.json({ error: "Token invalido" }, { status: 401 });
  }
}
