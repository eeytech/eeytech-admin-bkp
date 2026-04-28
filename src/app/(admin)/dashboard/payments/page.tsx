export const dynamic = "force-dynamic";

import dayjs from "dayjs";
import Link from "next/link";

import { PageShell } from "@/components/admin/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPaymentsOverview } from "@/lib/actions/finance";

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

function getStatusBadge(status: string) {
  if (status === "Pago") return <Badge>Pago</Badge>;
  if (status === "Vencido") return <Badge variant="destructive">Vencido</Badge>;
  if (status === "Cancelado") return <Badge variant="secondary">Cancelado</Badge>;
  return <Badge variant="outline">Pendente</Badge>;
}

export default async function PaymentsPage() {
  const payments = await getPaymentsOverview();

  const paidAmount = payments
    .filter((payment) => payment.status === "Pago")
    .reduce((total, payment) => total + Number(payment.amount), 0);
  const openAmount = payments
    .filter((payment) => payment.status === "Pendente" || payment.status === "Vencido")
    .reduce((total, payment) => total + Number(payment.amount), 0);
  const overdueCount = payments.filter((payment) => payment.status === "Vencido").length;

  return (
    <PageShell
      title="Receitas"
      description="Acompanhe recebíveis pagos, pendentes e vencidos de todos os clientes."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Receita recebida</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(paidAmount)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Em aberto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(openAmount)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Títulos vencidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 rounded-md border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Competência</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Nenhuma receita cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/companies/${payment.company.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {payment.company.tradeName || payment.company.name}
                      </Link>
                    </TableCell>
                    <TableCell>{payment.description || "Mensalidade"}</TableCell>
                    <TableCell>{payment.referenceMonth || "---"}</TableCell>
                    <TableCell>{payment.contract?.title || "Sem contrato"}</TableCell>
                    <TableCell>{dayjs(payment.dueDate).format("DD/MM/YYYY")}</TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageShell>
  );
}
