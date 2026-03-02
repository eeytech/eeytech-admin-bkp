import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export interface JWTPayload {
  sub: string;         // ID do Usuário
  email: string;       // E-mail para Bypass de Super Admin no SaaS
  application: string; // Slug da aplicação (ex: bye-carie)
  modules: Record<string, string[]>; // MBAC: { "pacientes": ["FULL"] }
}

export function generateAccessToken(
  payload: JWTPayload,
  expiresIn: SignOptions["expiresIn"] = "15m",
) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn });
}

export function generateRefreshToken(userId: string) {
  return jwt.sign({ sub: userId }, REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, ACCESS_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}
