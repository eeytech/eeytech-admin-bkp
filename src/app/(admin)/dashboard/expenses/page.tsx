export const dynamic = "force-dynamic";

import dayjs from "dayjs";

import { PageShell } from "@/components/admin/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getExpensesOverview } from "@/lib/actions/finance";
import { ExpensesManager } from "./_components/expenses-manager";

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

export default async function ExpensesPage() {
  const { items, totalAmount } = await getExpensesOverview();
  const currentMonthTotal = items
    .filter((expense) => dayjs(expense.expenseDate).isSame(dayjs(), "month"))
    .reduce((total, expense) => total + Number(expense.amount), 0);

  return (
    <PageShell
      title="Despesas"
      description="CRUD operacional para registrar e acompanhar os custos da eeyTech."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total acumulado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
            <p className="text-sm text-muted-foreground">
              Soma de todas as despesas cadastradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Despesas do mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentMonthTotal)}</div>
            <p className="text-sm text-muted-foreground">
              Gastos lançados no mês corrente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lançamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
            <p className="text-sm text-muted-foreground">
              Quantidade total de despesas registradas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <ExpensesManager expenses={items} />
      </div>
    </PageShell>
  );
}
