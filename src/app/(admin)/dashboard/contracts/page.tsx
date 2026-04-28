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
import { getContractsOverview } from "@/lib/actions/finance";

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

function getStatusBadge(status: string) {
  if (status === "Ativo") return <Badge>Ativo</Badge>;
  if (status === "Inadimplente") return <Badge variant="destructive">Inadimplente</Badge>;
  return <Badge variant="secondary">Cancelado</Badge>;
}

export default async function ContractsPage() {
  const contracts = await getContractsOverview();

  const activeContracts = contracts.filter((contract) => contract.status === "Ativo");
  const overdueContracts = contracts.filter(
    (contract) => contract.status === "Inadimplente",
  );
  const monthlyRevenue = activeContracts.reduce(
    (total, contract) => total + Number(contract.amount),
    0,
  );

  return (
    <PageShell
      title="Contratos"
      description="Visão consolidada dos contratos ativos, cancelados e inadimplentes dos clientes."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Contratos ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeContracts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Receita contratada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthlyRevenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Contratos inadimplentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueContracts.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 rounded-md border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Vencimento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nenhum contrato cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                contracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/companies/${contract.company.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {contract.company.tradeName || contract.company.name}
                      </Link>
                    </TableCell>
                    <TableCell>{contract.title}</TableCell>
                    <TableCell>{formatCurrency(contract.amount)}</TableCell>
                    <TableCell>{getStatusBadge(contract.status)}</TableCell>
                    <TableCell>{dayjs(contract.startDate).format("DD/MM/YYYY")}</TableCell>
                    <TableCell>{dayjs(contract.dueDate).format("DD/MM/YYYY")}</TableCell>
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
