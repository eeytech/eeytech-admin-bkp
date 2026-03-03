import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export interface SessionCompany {
  id: string;
  name: string;
}

export interface JWTPayload {
  sub: string;
  email: string;
  name?: string;
  application: string;
  applicationId: string;
  modules: Record<string, string[]>;
  isApplicationAdmin: boolean;
  companyIds: string[];
  companies: SessionCompany[];
  activeCompanyId: string;
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

