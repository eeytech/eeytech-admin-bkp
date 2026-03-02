"use server";

import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { db } from "@/lib/db";
import { applications, roles, userRoles, users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { requireModulePermission } from "@/lib/permissions/mbac";
import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";

const actionClient = createSafeActionClient();

const createUserSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  email: z.string().email("E-mail invalido"),
  password: z.string().min(8, "Senha deve ter no minimo 8 caracteres"),
  applicationId: z.string().uuid("Aplicacao invalida"),
});

export const createUserAction = actionClient
  .schema(createUserSchema)
  .action(async ({ parsedInput: { name, email, password, applicationId } }) => {
    await requireModulePermission("users", "WRITE", "eeytech-admin");

    const app = await db.query.applications.findFirst({
      where: and(
        eq(applications.id, applicationId),
        eq(applications.isActive, true),
      ),
    });

    if (!app) {
      throw new Error("Aplicacao nao encontrada ou inativa");
    }

    const passwordHash = await hashPassword(password);

    await db.insert(users).values({
      name,
      email,
      passwordHash,
      applicationId,
      isActive: true,
    });

    revalidatePath("/dashboard/users");
    return { success: true };
  });

const updateUserSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  email: z.string().email("E-mail invalido"),
  applicationId: z.string().uuid("Aplicacao invalida"),
});

export const updateUserAction = actionClient
  .schema(updateUserSchema)
  .action(async ({ parsedInput }) => {
    await requireModulePermission("users", "WRITE", "eeytech-admin");

    const targetApp = await db.query.applications.findFirst({
      where: eq(applications.id, parsedInput.applicationId),
    });

    if (!targetApp) {
      throw new Error("Aplicacao nao encontrada");
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, parsedInput.userId),
    });

    if (!currentUser) {
      throw new Error("Usuario nao encontrado");
    }

    await db
      .update(users)
      .set({
        name: parsedInput.name,
        email: parsedInput.email,
        applicationId: parsedInput.applicationId,
      })
      .where(eq(users.id, parsedInput.userId));

    if (currentUser.applicationId !== parsedInput.applicationId) {
      await db.delete(userRoles).where(eq(userRoles.userId, parsedInput.userId));
    }

    revalidatePath("/dashboard/users");
    return { success: true };
  });

export const toggleUserActiveAction = actionClient
  .schema(
    z.object({
      userId: z.string().uuid(),
      isActive: z.boolean(),
    }),
  )
  .action(async ({ parsedInput: { userId, isActive } }) => {
    await requireModulePermission("users", "WRITE", "eeytech-admin");

    await db.update(users).set({ isActive }).where(eq(users.id, userId));

    revalidatePath("/dashboard/users");
    return { success: true };
  });

export const deleteUserAction = actionClient
  .schema(z.object({ userId: z.string().uuid() }))
  .action(async ({ parsedInput: { userId } }) => {
    await requireModulePermission("users", "WRITE", "eeytech-admin");

    await db.delete(users).where(eq(users.id, userId));

    revalidatePath("/dashboard/users");
    return { success: true };
  });

const updateUserProfilesSchema = z.object({
  userId: z.string().uuid(),
  roleIds: z.array(z.string().uuid()),
});

export const updateUserProfilesAction = actionClient
  .schema(updateUserProfilesSchema)
  .action(async ({ parsedInput: { userId, roleIds } }) => {
    await requireModulePermission("users", "WRITE", "eeytech-admin");

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new Error("Usuario nao encontrado");
    }

    if (roleIds.length > 0) {
      const validRoles = await db.query.roles.findMany({
        where: and(
          inArray(roles.id, roleIds),
          eq(roles.applicationId, user.applicationId),
        ),
      });

      if (validRoles.length !== roleIds.length) {
        throw new Error("Perfis invalidos para a aplicacao do usuario");
      }
    }

    await db.transaction(async (tx) => {
      await tx.delete(userRoles).where(eq(userRoles.userId, userId));

      if (roleIds.length > 0) {
        await tx.insert(userRoles).values(
          roleIds.map((roleId) => ({
            userId,
            roleId,
          })),
        );
      }
    });

    revalidatePath("/dashboard/users");
    return { success: true };
  });

export const getUserProfilesAction = actionClient
  .schema(z.object({ userId: z.string().uuid() }))
  .action(async ({ parsedInput: { userId } }) => {
    await requireModulePermission("users", "READ", "eeytech-admin");

    const assignments = await db.query.userRoles.findMany({
      where: eq(userRoles.userId, userId),
    });

    return assignments.map((assignment) => assignment.roleId);
  });
