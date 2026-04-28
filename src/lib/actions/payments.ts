"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";

import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { requireModulePermission } from "@/lib/permissions/mbac";

const actionClient = createSafeActionClient();

function parseDateInput(value: string) {
  return new Date(`${value}T12:00:00`);
}

const moneySchema = z
  .string()
  .min(1, "Valor é obrigatório")
  .refine((value) => /^\d+(\.\d{1,2})?$/.test(value), "Valor monetário inválido");

const paymentSchema = z.object({
  companyId: z.string().uuid(),
  contractId: z.string().uuid().optional().or(z.literal("")).transform((value) => value || null),
  amount: moneySchema,
  status: z.enum(["Pendente", "Pago", "Vencido", "Cancelado"]).default("Pendente"),
  dueDate: z.string().min(1, "Data de vencimento é obrigatória").transform(parseDateInput),
  paidAt: z
    .string()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((value) => (value ? parseDateInput(value) : null)),
  description: z.string().optional(),
  referenceMonth: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || /^\d{4}-\d{2}$/.test(value), "Competência inválida")
    .transform((value) => value || null),
});

function revalidatePaymentPaths(companyId: string) {
  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard/finance");
  revalidatePath(`/dashboard/companies/${companyId}`);
}

export const createPaymentAction = actionClient
  .schema(paymentSchema)
  .action(async ({ parsedInput }) => {
    await requireModulePermission("companies", "WRITE", "eeytech-admin");

    await db.insert(payments).values({
      ...parsedInput,
      paidAt:
        parsedInput.status === "Pago" && !parsedInput.paidAt
          ? new Date()
          : parsedInput.paidAt,
      updatedAt: new Date(),
    });

    revalidatePaymentPaths(parsedInput.companyId);
    return { success: true };
  });

export const updatePaymentAction = actionClient
  .schema(paymentSchema.extend({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    await requireModulePermission("companies", "WRITE", "eeytech-admin");

    const { id, ...data } = parsedInput;

    await db
      .update(payments)
      .set({
        ...data,
        paidAt: data.status === "Pago" && !data.paidAt ? new Date() : data.paidAt,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, id));

    revalidatePaymentPaths(data.companyId);
    return { success: true };
  });

export const deletePaymentAction = actionClient
  .schema(
    z.object({
      id: z.string().uuid(),
      companyId: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput }) => {
    await requireModulePermission("companies", "WRITE", "eeytech-admin");

    await db.delete(payments).where(eq(payments.id, parsedInput.id));

    revalidatePaymentPaths(parsedInput.companyId);
    return { success: true };
  });

export const getPaymentsByCompanyAction = actionClient
  .schema(z.object({ companyId: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    await requireModulePermission("companies", "READ", "eeytech-admin");

    const items = await db.query.payments.findMany({
      where: eq(payments.companyId, parsedInput.companyId),
      orderBy: [desc(payments.dueDate)],
      with: {
        contract: true,
      },
    });

    return items;
  });
