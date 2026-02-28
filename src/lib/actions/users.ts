"use server";

import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { db } from "@/lib/db";
import { users, userModulePermissions } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { requireModulePermission } from "@/lib/permissions/mbac";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";

const actionClient = createSafeActionClient();

// 1. Ação para Criar Usuário
const createUserSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
});

export const createUserAction = actionClient
  .schema(createUserSchema)
  .action(async ({ parsedInput: { email, password } }) => {
    // Exige permissão de escrita em usuários no Admin Central
    await requireModulePermission("users", "WRITE", "eeytech-admin");

    const passwordHash = await hashPassword(password);

    await db.insert(users).values({
      email,
      passwordHash,
      isActive: true,
    });

    revalidatePath("/dashboard/users");
    return { success: true };
  });

// 2. Ação para Atualizar Permissões (Versão Multi-SaaS)
const updatePermissionsSchema = z.object({
  userId: z.string().uuid(),
  applicationId: z.string().uuid(),
  permissions: z.array(z.object({
    moduleSlug: z.string(),
    actions: z.array(z.string())
  }))
});

export const updateUserPermissionsAction = actionClient
  .schema(updatePermissionsSchema)
  .action(async ({ parsedInput: { userId, applicationId, permissions } }) => {
    // Validar se o administrador tem permissão
    await requireModulePermission("users", "WRITE", "eeytech-admin");

    await db.transaction(async (tx) => {
      // Limpa as permissões antigas do usuário apenas para a aplicação selecionada
      await tx.delete(userModulePermissions).where(
        and(
          eq(userModulePermissions.userId, userId),
          eq(userModulePermissions.applicationId, applicationId)
        )
      );

      // Prepara os novos registros
      const permissionsToInsert = permissions
        .filter(p => p.actions.length > 0)
        .map(p => ({
          userId,
          applicationId,
          moduleSlug: p.moduleSlug,
          actions: p.actions,
        }));

      if (permissionsToInsert.length > 0) {
        await tx.insert(userModulePermissions).values(permissionsToInsert);
      }
    });

    revalidatePath("/dashboard/users");
    return { success: true };
  });

// 3. Ação para Buscar Permissões Existentes
// Essencial para carregar os checkboxes marcados no Modal
export const getUserPermissionsAction = actionClient
  .schema(z.object({
    userId: z.string().uuid(),
    applicationId: z.string().uuid(),
  }))
  .action(async ({ parsedInput: { userId, applicationId } }) => {
    // Validação de acesso (leitura)
    await requireModulePermission("users", "READ", "eeytech-admin");

    // Busca as permissões na tabela de junção filtrando por usuário e app
    const permissions = await db.query.userModulePermissions.findMany({
      where: and(
        eq(userModulePermissions.userId, userId),
        eq(userModulePermissions.applicationId, applicationId)
      ),
    });

    return permissions;
  });
