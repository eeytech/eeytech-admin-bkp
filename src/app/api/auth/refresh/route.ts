import { db } from "@/lib/db";
import { sessions, users, userModulePermissions } from "@/lib/db/schema";
import { generateAccessToken } from "@/lib/auth/jwt";
import { eq, and, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const { refreshToken } = await req.json();

    // 1. Validar JWT do refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!,
    ) as { sub: string };

    // 2. Verificar no banco se o token existe e não expirou
    // Aproveitamos para buscar os dados do usuário (e-mail) na mesma consulta
    const session = await db.query.sessions.findFirst({
      where: and(
        eq(sessions.token, refreshToken),
        eq(sessions.userId, decoded.sub),
        gt(sessions.expiresAt, new Date()),
      ),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Sessão inválida ou expirada" },
        { status: 401 },
      );
    }

    // 3. Buscar o e-mail do usuário (necessário para o novo JWTPayload)
    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.sub),
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 401 },
      );
    }

    // 4. Buscar permissões atuais para o novo Access Token
    const permissions = await db.query.userModulePermissions.findMany({
      where: eq(userModulePermissions.userId, decoded.sub),
    });

    const moduleMap: Record<string, string[]> = {};
    permissions.forEach((p) => (moduleMap[p.moduleSlug] = p.actions));

    // 5. Gerar novo Access Token com o campo 'email' incluído
    const accessToken = generateAccessToken({
      sub: decoded.sub,
      email: user.email, // <--- Adicionado para satisfazer a tipagem JWTPayload
      application: "eeytech-admin",
      modules: moduleMap,
    });

    return NextResponse.json({ accessToken });
  } catch (error) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}
