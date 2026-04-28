// src/lib/db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import "dotenv/config"; // Isso carrega o .env automaticamente em qualquer lugar que importar o db

const connectionString =
  process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL_DIRECT ou DATABASE_URL não configurada");
}

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
