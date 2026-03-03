"use server";

import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  applications,
  roles,
  userCompanies,
  userRoles,
  users,
} from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { validateCompaniesBelongToApplication } from "@/lib/auth/company-context";
import { requireModulePermission } from "@/lib/permissions/mbac";
import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";

const actionClient = createSafeActionClient();

const createUserSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  email: z.string().email("E-mail invalido"),
  password: z.string().min(8, "Senha deve ter no minimo 8 caracteres"),
  applicationId: z.string().uuid("Aplicacao invalida"),
  roleIds: z.array(z.string().uuid()).min(1, "Selecione ao menos um perfil"),
  companyIds: z.array(z.string().uuid()).default([]),
  isApplicationAdmin: z.boolean().default(false),
});

export const createUserAction = actionClient
  .schema(createUserSchema)
  .action(async ({ parsedInput }) => {
    await requireModulePermission("users", "WRITE", "eeytech-admin");

    const app = await db.query.applications.findFirst({
      where: and(
        eq(applications.id, parsedInput.applicationId),
        eq(applications.isActive, true),
      ),
    });

    if (!app) {
      throw new Error("Aplicacao nao encontrada ou inativa");
    }

    const validRoles = await db.query.roles.findMany({
      where: and(
        inArray(roles.id, parsedInput.roleIds),
        eq(roles.applicationId, parsedInput.applicationId),
      ),
    });

    if (validRoles.length !== parsedInput.roleIds.length) {
      throw new Error("Perfis invalidos para a aplicacao selecionada");
    }

    if (!parsedInput.isApplicationAdmin && parsedInput.companyIds.length === 0) {
      throw new Error("Selecione ao menos uma empresa");
    }

    const validCompanies = await validateCompaniesBelongToApplication(
      parsedInput.applicationId,
      parsedInput.companyIds,
    );

    if (!parsedInput.isApplicationAdmin && validCompanies.length !== parsedInput.companyIds.length) {
      throw new Error("Empresas invalidas para a aplicacao selecionada");
    }

    const passwordHash = await hashPassword(parsedInput.password);

    await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          name: parsedInput.name,
          email: parsedInput.email,
          passwordHash,
          applicationId: parsedInput.applicationId,
          isApplicationAdmin: parsedInput.isApplicationAdmin,
          isActive: true,
        })
        .returning({ id: users.id });

      await tx.insert(userRoles).values(
        parsedInput.roleIds.map((roleId) => ({
          userId: newUser.id,
          roleId,
        })),
      );

      if (!parsedInput.isApplicationAdmin && parsedInput.companyIds.length > 0) {
        await tx.insert(userCompanies).values(
          parsedInput.companyIds.map((companyId) => ({
            userId: newUser.id,
            companyId,
          })),
        );
      }
    });

    revalidatePath("/dashboard/users");
    return { success: true };
  });

const updateUserSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  email: z.string().email("E-mail invalido"),
  applicationId: z.string().uuid("Aplicacao invalida"),
  roleIds: z.array(z.string().uuid()).min(1, "Selecione ao menos um perfil"),
  companyIds: z.array(z.string().uuid()).default([]),
  isApplicationAdmin: z.boolean().default(false),
});

export const updateUserAction = actionClient
  .schema(updateUserSchema)
  .action(async ({ parsedInput }) => {
    await requireModulePermission("users", "WRITE", "eeytech-admin");

    const targetApp = await db.query.applications.findFirst({
      where: and(
        eq(applications.id, parsedInput.applicationId),
        eq(applications.isActive, true),
      ),
    });

    if (!targetApp) {
      throw new Error("Aplicacao nao encontrada ou inativa");
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, parsedInput.userId),
    });

    if (!currentUser) {
      throw new Error("Usuario nao encontrado");
    }

    const validRoles = await db.query.roles.findMany({
      where: and(
        inArray(roles.id, parsedInput.roleIds),
        eq(roles.applicationId, parsedInput.applicationId),
      ),
    });

    if (validRoles.length !== parsedInput.roleIds.length) {
      throw new Error("Perfis invalidos para a aplicacao selecionada");
    }

    if (!parsedInput.isApplicationAdmin && parsedInput.companyIds.length === 0) {
      throw new Error("Selecione ao menos uma empresa");
    }

    const validCompanies = await validateCompaniesBelongToApplication(
      parsedInput.applicationId,
      parsedInput.companyIds,
    );

    if (!parsedInput.isApplicationAdmin && validCompanies.length !== parsedInput.companyIds.length) {
      throw new Error("Empresas invalidas para a aplicacao selecionada");
    }

    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          name: parsedInput.name,
          email: parsedInput.email,
          applicationId: parsedInput.applicationId,
          isApplicationAdmin: parsedInput.isApplicationAdmin,
        })
        .where(eq(users.id, parsedInput.userId));

      await tx.delete(userRoles).where(eq(userRoles.userId, parsedInput.userId));
      await tx.insert(userRoles).values(
        parsedInput.roleIds.map((roleId) => ({
          userId: parsedInput.userId,
          roleId,
        })),
      );

      await tx
        .delete(userCompanies)
        .where(eq(userCompanies.userId, parsedInput.userId));

      if (!parsedInput.isApplicationAdmin && parsedInput.companyIds.length > 0) {
        await tx.insert(userCompanies).values(
          parsedInput.companyIds.map((companyId) => ({
            userId: parsedInput.userId,
            companyId,
          })),
        );
      }

    });

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

export const getUserCompaniesAction = actionClient
  .schema(z.object({ userId: z.string().uuid() }))
  .action(async ({ parsedInput: { userId } }) => {
    await requireModulePermission("users", "READ", "eeytech-admin");

    const assignments = await db.query.userCompanies.findMany({
      where: eq(userCompanies.userId, userId),
    });

    return assignments.map((assignment) => assignment.companyId);
  });

