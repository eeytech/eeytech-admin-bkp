import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { comparePassword, hashPassword } from "@/lib/auth/password";

const changePasswordSchema = z.object({
  senha_atual: z.string().min(1, "Senha atual obrigatoria"),
  nova_senha: z.string().min(8, "A nova senha deve ter no minimo 8 caracteres"),
});

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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Payload invalido",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const authHeader = req.headers.get("authorization");
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get("auth_token")?.value;
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;
    const token = bearerToken ?? cookieToken;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Nao autorizado" },
        { status: 401 },
      );
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Token invalido" },
        { status: 401 },
      );
    }

    const [user] = await db
      .select({
        id: users.id,
        passwordHash: users.passwordHash,
        applicationId: users.applicationId,
      })
      .from(users)
      .where(and(eq(users.id, payload.sub), eq(users.applicationId, payload.applicationId)))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuario nao encontrado" },
        { status: 404 },
      );
    }

    const isCurrentPasswordValid = await comparePassword(
      parsed.data.senha_atual,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Senha atual incorreta" },
        { status: 400 },
      );
    }

    const isSamePassword = await comparePassword(
      parsed.data.nova_senha,
      user.passwordHash,
    );
    if (isSamePassword) {
      return NextResponse.json(
        { success: false, error: "A nova senha deve ser diferente da atual" },
        { status: 400 },
      );
    }

    const newHash = await hashPassword(parsed.data.nova_senha);
    await db
      .update(users)
      .set({ passwordHash: newHash })
      .where(eq(users.id, user.id));

    const response = NextResponse.json({
      success: true,
      message: "Senha atualizada com sucesso",
    });

    const origin = req.headers.get("origin");
    if (origin) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
    }

    return response;
  } catch (error) {
    console.error("Change Password Error:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno ao atualizar senha" },
      { status: 500 },
    );
  }
}
