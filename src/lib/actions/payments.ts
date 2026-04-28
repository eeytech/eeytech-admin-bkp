"use server";

import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { requireModulePermission } from "@/lib/permissions/mbac";

const actionClient = createSafeActionClient();

const paymentSchema = z.object({
  companyId: z.string().uuid(),
  amount: z.string().min(1, "Valor é obrigatório"),
  status: z.enum(["paid", "pending", "overdue", "canceled"]).default("pending"),
  dueDate: z.string().transform((str) => new Date(str)),
  paidAt: z.string().optional().nullable().transform((str) => str ? new Date(str) : null),
  description: z.string().optional(),
});

export const createPaymentAction = actionClient
  .schema(paymentSchema)
  .action(async ({ parsedInput }) => {
    await requireModulePermission("companies", "WRITE", "eeytech-admin");

    await db.insert(payments).values({
      ...parsedInput,
      updatedAt: new Date(),
    });

    revalidatePath(`/dashboard/companies/${parsedInput.companyId}`);
    return { success: true };
  });

export const updatePaymentAction = actionClient
  .schema(paymentSchema.extend({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    await requireModulePermission("companies", "WRITE", "eeytech-admin");

    const { id, ...data } = parsedInput;

    await db.update(payments)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, id));

    revalidatePath(`/dashboard/companies/${data.companyId}`);
    return { success: true };
  });

export const deletePaymentAction = actionClient
  .schema(z.object({ id: z.string().uuid(), companyId: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    await requireModulePermission("companies", "WRITE", "eeytech-admin");

    await db.delete(payments).where(eq(payments.id, parsedInput.id));

    revalidatePath(`/dashboard/companies/${parsedInput.companyId}`);
    return { success: true };
  });

export const getPaymentsByCompanyAction = actionClient
  .schema(z.object({ companyId: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    await requireModulePermission("companies", "READ", "eeytech-admin");

    const items = await db.query.payments.findMany({
      where: eq(payments.companyId, parsedInput.companyId),
      orderBy: [desc(payments.dueDate)],
    });

    return items;
  });
