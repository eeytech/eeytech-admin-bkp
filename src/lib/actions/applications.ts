"use server";

import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { db } from "@/lib/db";
import { applications, modules } from "@/lib/db/schema";
import { requireModulePermission } from "@/lib/permissions/mbac";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { eq } from "drizzle-orm";

const actionClient = createSafeActionClient();

// Ação de criar aplicação
export const createApplicationAction = actionClient
  .schema(z.object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  }))
  .action(async ({ parsedInput: { name, slug } }) => {
    await requireModulePermission("applications", "WRITE");
    const apiKey = `ey_${crypto.randomBytes(16).toString("hex")}`;
    await db.insert(applications).values({ name, slug, apiKey });
    revalidatePath("/dashboard/applications");
    return { success: true };
  });

// Ação de criar módulo
export const createModuleAction = actionClient
  .schema(z.object({
    applicationId: z.string().uuid(),
    name: z.string().min(2),
    slug: z.string().min(2),
  }))
  .action(async ({ parsedInput }) => {
    await requireModulePermission("applications", "WRITE");

    await db.insert(modules).values({
      applicationId: parsedInput.applicationId,
      name: parsedInput.name,
      slug: parsedInput.slug,
    });

    revalidatePath("/dashboard/applications");
    return { success: true };
  });

// NOVA AÇÃO: Excluir Aplicação
export const deleteApplicationAction = actionClient
  .schema(z.object({
    id: z.string().uuid(),
  }))
  .action(async ({ parsedInput: { id } }) => {
    await requireModulePermission("applications", "WRITE");
    
    await db.delete(applications).where(eq(applications.id, id));
    
    revalidatePath("/dashboard/applications");
    return { success: true };
  });