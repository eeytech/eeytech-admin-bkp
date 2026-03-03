"use server";

import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { applications, companies } from "@/lib/db/schema";
import { requireModulePermission } from "@/lib/permissions/mbac";

const actionClient = createSafeActionClient();

const companyStatusSchema = z.enum(["active", "inactive"]);

export const createCompanyAction = actionClient
  .schema(
    z.object({
      applicationId: z.string().uuid(),
      name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
      cnpj: z.string().trim().optional(),
    }),
  )
  .action(async ({ parsedInput }) => {
    await requireModulePermission("applications", "WRITE", "eeytech-admin");

    const app = await db.query.applications.findFirst({
      where: and(
        eq(applications.id, parsedInput.applicationId),
        eq(applications.isActive, true),
      ),
    });

    if (!app) {
      throw new Error("Aplicacao nao encontrada ou inativa");
    }

    await db.insert(companies).values({
      applicationId: parsedInput.applicationId,
      name: parsedInput.name,
      cnpj: parsedInput.cnpj || null,
      status: "active",
      updatedAt: new Date(),
    });

    revalidatePath(`/dashboard/applications/${parsedInput.applicationId}/companies`);
    revalidatePath("/dashboard/applications");
    return { success: true };
  });

export const updateCompanyAction = actionClient
  .schema(
    z.object({
      companyId: z.string().uuid(),
      applicationId: z.string().uuid(),
      name: z.string().min(2),
      cnpj: z.string().trim().optional(),
      status: companyStatusSchema,
    }),
  )
  .action(async ({ parsedInput }) => {
    await requireModulePermission("applications", "WRITE", "eeytech-admin");

    const company = await db.query.companies.findFirst({
      where: and(
        eq(companies.id, parsedInput.companyId),
        eq(companies.applicationId, parsedInput.applicationId),
      ),
    });

    if (!company) {
      throw new Error("Empresa nao encontrada para esta aplicacao");
    }

    await db
      .update(companies)
      .set({
        name: parsedInput.name,
        cnpj: parsedInput.cnpj || null,
        status: parsedInput.status,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, parsedInput.companyId));

    revalidatePath(`/dashboard/applications/${parsedInput.applicationId}/companies`);
    revalidatePath("/dashboard/applications");
    return { success: true };
  });

export const toggleCompanyStatusAction = actionClient
  .schema(
    z.object({
      companyId: z.string().uuid(),
      applicationId: z.string().uuid(),
      status: companyStatusSchema,
    }),
  )
  .action(async ({ parsedInput }) => {
    await requireModulePermission("applications", "WRITE", "eeytech-admin");

    await db
      .update(companies)
      .set({
        status: parsedInput.status,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(companies.id, parsedInput.companyId),
          eq(companies.applicationId, parsedInput.applicationId),
        ),
      );

    revalidatePath(`/dashboard/applications/${parsedInput.applicationId}/companies`);
    revalidatePath("/dashboard/applications");
    return { success: true };
  });

export const deleteCompanyAction = actionClient
  .schema(
    z.object({
      companyId: z.string().uuid(),
      applicationId: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput }) => {
    await requireModulePermission("applications", "WRITE", "eeytech-admin");

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(companies)
      .where(eq(companies.applicationId, parsedInput.applicationId));

    if (Number(count) <= 1) {
      throw new Error("A aplicacao precisa manter ao menos uma empresa");
    }

    await db
      .delete(companies)
      .where(
        and(
          eq(companies.id, parsedInput.companyId),
          eq(companies.applicationId, parsedInput.applicationId),
        ),
      );

    revalidatePath(`/dashboard/applications/${parsedInput.applicationId}/companies`);
    revalidatePath("/dashboard/applications");
    return { success: true };
  });

