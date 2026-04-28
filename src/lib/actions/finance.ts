"use server";

import dayjs from "dayjs";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";

import { db } from "@/lib/db";
import { companies, contracts, expenses, payments } from "@/lib/db/schema";
import { requireModulePermission } from "@/lib/permissions/mbac";

const actionClient = createSafeActionClient();

function parseDateInput(value: string) {
  return new Date(`${value}T12:00:00`);
}

const moneySchema = z
  .string()
  .min(1, "Valor é obrigatório")
  .refine((value) => /^\d+(\.\d{1,2})?$/.test(value), "Valor monetário inválido");

const expenseSchema = z.object({
  description: z.string().min(2, "Descrição deve ter ao menos 2 caracteres"),
  category: z.enum([
    "Infraestrutura",
    "APIs",
    "Operacional",
    "Marketing",
    "Pessoal",
    "Tributos",
    "Outros",
  ]),
  amount: moneySchema,
  expenseDate: z.string().min(1, "Data da despesa é obrigatória").transform(parseDateInput),
});

function revalidateFinancePaths() {
  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard/expenses");
}

export const createExpenseAction = actionClient
  .schema(expenseSchema)
  .action(async ({ parsedInput }) => {
    await requireModulePermission("finance", "WRITE", "eeytech-admin");

    await db.insert(expenses).values({
      ...parsedInput,
      updatedAt: new Date(),
    });

    revalidateFinancePaths();
    return { success: true };
  });

export const updateExpenseAction = actionClient
  .schema(expenseSchema.extend({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    await requireModulePermission("finance", "WRITE", "eeytech-admin");

    const { id, ...data } = parsedInput;

    await db
      .update(expenses)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(expenses.id, id));

    revalidateFinancePaths();
    return { success: true };
  });

export const deleteExpenseAction = actionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    await requireModulePermission("finance", "WRITE", "eeytech-admin");

    await db.delete(expenses).where(eq(expenses.id, parsedInput.id));

    revalidateFinancePaths();
    return { success: true };
  });

export async function getFinanceOverview() {
  await requireModulePermission("finance", "READ", "eeytech-admin");

  const nowIso = dayjs().toISOString();
  const monthStart = dayjs().startOf("month").toDate();
  const monthEnd = dayjs().endOf("month").toDate();

  const [
    [activeContractsRow],
    [expectedRevenueRow],
    [monthlyExpensesRow],
    [overdueRow],
    recentExpenses,
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(contracts)
      .where(eq(contracts.status, "Ativo")),
    db
      .select({
        total: sql<string>`coalesce(sum(${contracts.amount}), 0)`,
      })
      .from(contracts)
      .where(eq(contracts.status, "Ativo")),
    db
      .select({
        total: sql<string>`coalesce(sum(${expenses.amount}), 0)`,
      })
      .from(expenses)
      .where(and(gte(expenses.expenseDate, monthStart), lte(expenses.expenseDate, monthEnd))),
    db
      .select({
        total: sql<string>`
          coalesce(
            sum(
              case
                when ${payments.status} = 'Vencido'
                  or (${payments.status} = 'Pendente' and ${payments.dueDate} < ${nowIso})
                then ${payments.amount}
                else 0
              end
            ),
            0
          )
        `,
      })
      .from(payments),
    db.query.expenses.findMany({
      orderBy: [desc(expenses.expenseDate)],
      limit: 5,
    }),
  ]);

  return {
    activeContracts: Number(activeContractsRow?.count ?? 0),
    expectedRevenue: String(expectedRevenueRow?.total ?? "0"),
    monthlyExpenses: String(monthlyExpensesRow?.total ?? "0"),
    overdueAmount: String(overdueRow?.total ?? "0"),
    recentExpenses,
  };
}

export async function getExpensesOverview() {
  await requireModulePermission("finance", "READ", "eeytech-admin");

  const items = await db.query.expenses.findMany({
    orderBy: [desc(expenses.expenseDate), desc(expenses.createdAt)],
  });

  const [summary] = await db
    .select({
      total: sql<string>`coalesce(sum(${expenses.amount}), 0)`,
    })
    .from(expenses);

  return {
    items,
    totalAmount: String(summary?.total ?? "0"),
  };
}

export async function getContractsOverview() {
  await requireModulePermission("finance", "READ", "eeytech-admin");

  return db.query.contracts.findMany({
    orderBy: [desc(contracts.createdAt)],
    with: {
      company: {
        columns: {
          id: true,
          name: true,
          tradeName: true,
        },
      },
      payments: true,
    },
  });
}

export async function getPaymentsOverview() {
  await requireModulePermission("finance", "READ", "eeytech-admin");

  return db.query.payments.findMany({
    orderBy: [desc(payments.dueDate), desc(payments.createdAt)],
    with: {
      company: {
        columns: {
          id: true,
          name: true,
          tradeName: true,
        },
      },
      contract: {
        columns: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  });
}

export async function getCompanyFinanceSummary(companyId: string) {
  await requireModulePermission("companies", "READ", "eeytech-admin");

  const [company] = await db
    .select({
      id: companies.id,
      name: companies.name,
    })
    .from(companies)
    .where(eq(companies.id, companyId));

  if (!company) {
    return null;
  }

  const [currentContract] = await db.query.contracts.findMany({
    where: eq(contracts.companyId, companyId),
    orderBy: [desc(contracts.startDate)],
    limit: 1,
  });

  const companyPayments = await db.query.payments.findMany({
    where: eq(payments.companyId, companyId),
    orderBy: [desc(payments.dueDate)],
    with: {
      contract: true,
    },
  });

  const overdueCount = companyPayments.filter((payment) => {
    if (payment.status === "Vencido") return true;
    return payment.status === "Pendente" && payment.dueDate < new Date();
  }).length;

  return {
    company,
    currentContract,
    payments: companyPayments,
    overdueCount,
  };
}
