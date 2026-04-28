"use server";

import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { db } from "@/lib/db";
import { rolePermissions, roles } from "@/lib/db/schema";
import { requireModulePermission } from "@/lib/permissions/mbac";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

const actionClient = createSafeActionClient();

export const createRoleAction = actionClient
  .schema(z.object({
    name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
    applicationId: z.string().uuid("Selecione uma aplicação válida"),
    description: z.string().optional(),
  }))
  .action(async ({ parsedInput }) => {
    // Exige permissão de escrita em roles no painel administrativo
    await requireModulePermission("roles", "WRITE", "eeytech-admin");

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

const rolePermissionsSchema = z.object({
  roleId: z.string().uuid(),
  permissions: z.array(
    z.object({
      moduleSlug: z.string(),
      actions: z.array(z.string()),
    }),
  ),
});

export const updateRolePermissionsAction = actionClient
  .schema(rolePermissionsSchema)
  .action(async ({ parsedInput: { roleId, permissions } }) => {
    // Exige permissão de escrita em roles no painel administrativo
    await requireModulePermission("roles", "WRITE", "eeytech-admin");

    await db.transaction(async (tx) => {
      await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

      const permissionsToInsert = permissions
        .filter((permission) => permission.actions.length > 0)
        .map((permission) => ({
          roleId,
          moduleSlug: permission.moduleSlug,
          actions: permission.actions,
        }));

      if (permissionsToInsert.length > 0) {
        await tx.insert(rolePermissions).values(permissionsToInsert);
      }
    });

    revalidatePath("/dashboard/roles");
    return { success: true };
  });

export const getRolePermissionsAction = actionClient
  .schema(z.object({ roleId: z.string().uuid() }))
  .action(async ({ parsedInput: { roleId } }) => {
    // Exige permissão de leitura em roles no painel administrativo
    await requireModulePermission("roles", "READ", "eeytech-admin");

    const permissions = await db.query.rolePermissions.findMany({
      where: eq(rolePermissions.roleId, roleId),
    });

    return permissions;
  });

export const deleteRoleAction = actionClient
  .schema(z.object({ roleId: z.string().uuid() }))
  .action(async ({ parsedInput: { roleId } }) => {
    // Exige permissão de escrita em roles no painel administrativo
    await requireModulePermission("roles", "WRITE", "eeytech-admin");

    await db.delete(roles).where(eq(roles.id, roleId));

    revalidatePath("/dashboard/roles");
    return { success: true };
  });
