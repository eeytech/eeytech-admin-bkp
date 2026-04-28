"use server";

import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { and, eq, sql, desc, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { applications, companies } from "@/lib/db/schema";
import { requireModulePermission } from "@/lib/permissions/mbac";

const actionClient = createSafeActionClient();

const companyStatusSchema = z.enum(["active", "inactive"]);

const companyFormSchema = z.object({
  applicationId: z.string().uuid("Aplicação inválida"),
  name: z.string().min(2, "Razão Social deve ter ao menos 2 caracteres"),
  tradeName: z.string().optional(),
  cnpj: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  status: companyStatusSchema.default("active"),
  // Endereço
  zipCode: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().max(2, "UF deve ter 2 caracteres").optional(),
});

export const createCompanyAction = actionClient
  .schema(companyFormSchema)
  .action(async ({ parsedInput }) => {
    await requireModulePermission("companies", "WRITE", "eeytech-admin");

    const app = await db.query.applications.findFirst({
      where: and(
        eq(applications.id, parsedInput.applicationId),
        eq(applications.isActive, true),
      ),
    });

    if (!app) {
      throw new Error("Aplicação não encontrada ou inativa");
    }

    await db.insert(companies).values({
      ...parsedInput,
      updatedAt: new Date(),
    });

    revalidatePath("/dashboard/companies");
    revalidatePath(`/dashboard/applications/${parsedInput.applicationId}/companies`);
    return { success: true };
  });

export const updateCompanyAction = actionClient
  .schema(companyFormSchema.extend({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    await requireModulePermission("companies", "WRITE", "eeytech-admin");

    const { id, ...data } = parsedInput;

    const company = await db.query.companies.findFirst({
      where: eq(companies.id, id),
    });

    if (!company) {
      throw new Error("Empresa não encontrada");
    }

    await db
      .update(companies)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, id));

    revalidatePath("/dashboard/companies");
    revalidatePath(`/dashboard/companies/${id}`);
    revalidatePath(`/dashboard/applications/${data.applicationId}/companies`);
    return { success: true };
  });

export const deleteCompanyAction = actionClient
  .schema(z.object({ id: z.string().uuid(), applicationId: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    await requireModulePermission("companies", "WRITE", "eeytech-admin");

    await db.delete(companies).where(eq(companies.id, parsedInput.id));

    revalidatePath("/dashboard/companies");
    revalidatePath(`/dashboard/applications/${parsedInput.applicationId}/companies`);
    return { success: true };
  });

export const getCompaniesAction = actionClient
  .schema(z.object({
    page: z.number().default(1),
    pageSize: z.number().default(10),
    search: z.string().optional(),
  }))
  .action(async ({ parsedInput }) => {
    await requireModulePermission("companies", "READ", "eeytech-admin");

    const { page, pageSize, search } = parsedInput;
    const offset = (page - 1) * pageSize;

    const whereClause = search 
      ? or(
          ilike(companies.name, `%${search}%`),
          ilike(companies.cnpj, `%${search}%`),
          ilike(companies.email, `%${search}%`)
        )
      : undefined;

    const items = await db.query.companies.findMany({
      where: whereClause,
      limit: pageSize,
      offset: offset,
      orderBy: [desc(companies.createdAt)],
      with: {
        application: true,
      }
    });

    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(companies)
      .where(whereClause);
    
    const totalCount = Number(totalCountResult[0].count);

    return {
      items,
      totalCount,
      pageCount: Math.ceil(totalCount / pageSize),
    };
  });
