"use server";

import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { db } from "@/lib/db";
import { roles } from "@/lib/db/schema";
import { requireModulePermission } from "@/lib/permissions/mbac";
import { revalidatePath } from "next/cache";

const actionClient = createSafeActionClient();

export const createRoleAction = actionClient
  .schema(z.object({
    name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
    applicationId: z.string().uuid("Selecione uma aplicação válida"),
    description: z.string().optional(),
  }))
  .action(async ({ parsedInput }) => {
    // Exige permissão de escrita em roles no painel administrativo
    await requireModulePermission("roles", "WRITE", "admin-platform");

    const slug = parsedInput.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    await db.insert(roles).values({
      name: parsedInput.name,
      slug,
      applicationId: parsedInput.applicationId,
      description: parsedInput.description,
    });

    revalidatePath("/dashboard/roles");
    return { success: true };
  });