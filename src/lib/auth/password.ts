import bcrypt from "bcryptjs";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

// Corrigido para o singular: comparePassword
export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}