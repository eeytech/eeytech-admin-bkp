"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";

import { db } from "@/lib/db";
import { contracts } from "@/lib/db/schema";
import { requireModulePermission } from "@/lib/permissions/mbac";

const actionClient = createSafeActionClient();

function parseDateInput(value: string) {
  return new Date(`${value}T12:00:00`);
}

const moneySchema = z
  .string()
  .min(1, "Valor é obrigatório")
  .refine((value) => /^\d+(\.\d{1,2})?$/.test(value), "Valor monetário inválido");

const contractSchema = z.object({
  companyId: z.string().uuid(),
  title: z.string().min(2, "Título deve ter ao menos 2 caracteres"),
  amount: moneySchema,
  status: z.enum(["Ativo", "Cancelado", "Inadimplente"]).default("Ativo"),
  startDate: z.string().min(1, "Data de início é obrigatória").transform(parseDateInput),
  dueDate: z.string().min(1, "Data de vencimento é obrigatória").transform(parseDateInput),
  endDate: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? parseDateInput(value) : null)),
  documentUrl: z
    .string()
    .url("URL inválida")
    .optional()
    .or(z.literal(""))
    .transform((value) => value || null),
});

function revalidateContractPaths(companyId: string) {
  revalidatePath("/dashboard/contracts");
  revalidatePath("/dashboard/finance");
  revalidatePath(`/dashboard/companies/${companyId}`);
}

export const createContractAction = actionClient
  .schema(contractSchema)
  .action(async ({ parsedInput }) => {
    await requireModulePermission("companies", "WRITE", "eeytech-admin");

    await db.insert(contracts).values({
      ...parsedInput,
      updatedAt: new Date(),
    });

    revalidateContractPaths(parsedInput.companyId);
    return { success: true };
  });

export const updateContractAction = actionClient
  .schema(contractSchema.extend({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    await requireModulePermission("companies", "WRITE", "eeytech-admin");

    const { id, ...data } = parsedInput;

    await db
      .update(contracts)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(contracts.id, id));

    revalidateContractPaths(data.companyId);
    return { success: true };
  });

export const deleteContractAction = actionClient
  .schema(
    z.object({
      id: z.string().uuid(),
      companyId: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput }) => {
    await requireModulePermission("companies", "WRITE", "eeytech-admin");

    await db.delete(contracts).where(eq(contracts.id, parsedInput.id));

    revalidateContractPaths(parsedInput.companyId);
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
