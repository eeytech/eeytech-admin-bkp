"use server";

import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { contracts } from "@/lib/db/schema";
import { requireModulePermission } from "@/lib/permissions/mbac";

const actionClient = createSafeActionClient();

const contractSchema = z.object({
  companyId: z.string().uuid(),
  title: z.string().min(2, "Título deve ter ao menos 2 caracteres"),
  status: z.enum(["active", "expired", "terminated"]).default("active"),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().optional().transform((str) => str ? new Date(str) : null),
  documentUrl: z.string().url("URL inválida").optional().or(z.literal("")),
});

export const createContractAction = actionClient
  .schema(contractSchema)
  .action(async ({ parsedInput }) => {
    await requireModulePermission("companies", "WRITE", "eeytech-admin");

    await db.insert(contracts).values({
      ...parsedInput,
      updatedAt: new Date(),
    });

    revalidatePath(`/dashboard/companies/${parsedInput.companyId}`);
    return { success: true };
  });

export const updateContractAction = actionClient
  .schema(contractSchema.extend({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    await requireModulePermission("companies", "WRITE", "eeytech-admin");

    const { id, ...data } = parsedInput;

    await db.update(contracts)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(contracts.id, id));

    revalidatePath(`/dashboard/companies/${data.companyId}`);
    return { success: true };
  });

export const deleteContractAction = actionClient
  .schema(z.object({ id: z.string().uuid(), companyId: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    await requireModulePermission("companies", "WRITE", "eeytech-admin");

    await db.delete(contracts).where(eq(contracts.id, parsedInput.id));

    revalidatePath(`/dashboard/companies/${parsedInput.companyId}`);
    return { success: true };
  });

export const getContractsByCompanyAction = actionClient
  .schema(z.object({ companyId: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    await requireModulePermission("companies", "READ", "eeytech-admin");

    const items = await db.query.contracts.findMany({
      where: eq(contracts.companyId, parsedInput.companyId),
      orderBy: [desc(contracts.startDate)],
    });

    return items;
  });
