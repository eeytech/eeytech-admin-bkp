export const dynamic = "force-dynamic";

import dayjs from "dayjs";

import { PageShell } from "@/components/admin/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFinanceOverview } from "@/lib/actions/finance";

function formatCurrency(value: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

export default async function FinanceDashboardPage() {
  const overview = await getFinanceOverview();
  const expectedRevenue = Number(overview.expectedRevenue);
  const overdueAmount = Number(overview.overdueAmount);
  const delinquencyRate =
    expectedRevenue > 0 ? (overdueAmount / expectedRevenue) * 100 : 0;

  return (
    <PageShell
      title="Dashboard financeiro"
      description="Visão executiva dos contratos, recebíveis e despesas operacionais da eeyTech."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Contratos ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.activeContracts}</div>
            <p className="text-sm text-muted-foreground">
              Base ativa de clientes com contrato vigente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Receita mensal esperada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(overview.expectedRevenue)}
            </div>
            <p className="text-sm text-muted-foreground">
              Soma dos contratos ativos cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Despesas do mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(overview.monthlyExpenses)}
            </div>
            <p className="text-sm text-muted-foreground">
              Total registrado no mês atual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inadimplência</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(overview.overdueAmount)}
            </div>
            <p className="text-sm text-muted-foreground">
              {delinquencyRate.toFixed(1).replace(".", ",")}% da receita contratada
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle>Saúde financeira</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
              <p className="text-sm font-medium">Receita contratada x inadimplência</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {overdueAmount > 0
                  ? "Existem valores em atraso que merecem acompanhamento imediato."
                  : "Nenhum valor em atraso identificado no momento."}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
              <p className="text-sm font-medium">Pressão de despesas</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {expectedRevenue > 0
                  ? `${((Number(overview.monthlyExpenses) / expectedRevenue) * 100)
                      .toFixed(1)
                      .replace(".", ",")}% da receita esperada do mês já está comprometida com despesas.`
                  : "Cadastre contratos para começar a medir margem operacional."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimas despesas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview.recentExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma despesa cadastrada até agora.
              </p>
            ) : (
              overview.recentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-start justify-between border-b pb-3 last:border-b-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{expense.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {expense.category} • {dayjs(expense.expenseDate).format("DD/MM/YYYY")}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    {formatCurrency(String(expense.amount))}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
