import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (token) {
      const payload = verifyAccessToken(token);

      if (payload) {
        // 1. Revogar todas as sessões do usuário no banco (Logout de todos os dispositivos)
        // Ou você pode passar o refreshToken no corpo da requisição para revogar apenas uma.
        await db.delete(sessions).where(eq(sessions.userId, payload.sub));
      }
    }

    // 2. Limpar o cookie de autenticação
    cookieStore.delete("auth_token");

    return NextResponse.json({
      success: true,
      message: "Logout realizado com sucesso",
    });
  } catch (error) {
    console.error("Logout Error:", error);
    return NextResponse.json(
      { error: "Erro ao processar logout" },
      { status: 500 },
    );
  }
}
