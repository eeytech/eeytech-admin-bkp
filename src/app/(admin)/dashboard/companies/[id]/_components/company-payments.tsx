"use client";

import dayjs from "dayjs";
import { AlertCircle, CheckCircle2, Clock3, CreditCard, Trash2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { deletePaymentAction } from "@/lib/actions/payments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreatePaymentModal } from "./create-payment-modal";

interface ContractItem {
  id: string;
  title: string;
  status: string;
}

interface PaymentItem {
  id: string;
  contractId: string | null;
  amount: string;
  status: string;
  dueDate: Date | string;
  paidAt: Date | string | null;
  description: string | null;
  referenceMonth: string | null;
  contract?: {
    id: string;
    title: string;
    status: string;
  } | null;
}

interface CompanyPaymentsProps {
  companyId: string;
  contracts: ContractItem[];
  payments: PaymentItem[];
}

function formatCurrency(amount: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(amount));
}

function getStatusBadge(status: string) {
  switch (status) {
    case "Pago":
      return (
        <Badge className="gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
          <CheckCircle2 className="h-3 w-3" />
          Pago
        </Badge>
      );
    case "Pendente":
      return (
        <Badge variant="outline" className="gap-1 border-amber-200 bg-amber-50 text-amber-700">
          <Clock3 className="h-3 w-3" />
          Pendente
        </Badge>
      );
    case "Vencido":
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Vencido
        </Badge>
      );
    case "Cancelado":
      return <Badge variant="secondary">Cancelado</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function CompanyPayments({
  companyId,
  contracts,
  payments: initialPayments,
}: CompanyPaymentsProps) {
  const { execute: deletePayment, isExecuting: isDeleting } = useAction(
    deletePaymentAction,
    {
      onSuccess: () => {
        toast.success("Recebível removido com sucesso!");
      },
      onError: ({ error }) => {
        toast.error(error.serverError || "Erro ao remover recebível");
      },
    },
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Histórico de receitas</h3>
          <p className="text-sm text-muted-foreground">
            Acompanhe mensalidades, pagamentos quitados e valores em aberto.
          </p>
        </div>
        <CreatePaymentModal companyId={companyId} contracts={contracts} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Competência</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    Nenhum recebível registrado.
                  </TableCell>
                </TableRow>
              ) : (
                initialPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        {payment.description || "Mensalidade"}
                      </div>
                    </TableCell>
                    <TableCell>{payment.referenceMonth || "---"}</TableCell>
                    <TableCell>{payment.contract?.title || "Sem contrato"}</TableCell>
                    <TableCell>{dayjs(payment.dueDate).format("DD/MM/YYYY")}</TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell>
                      {payment.paidAt ? dayjs(payment.paidAt).format("DD/MM/YYYY") : "---"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm("Deseja excluir este recebível?")) {
                            deletePayment({ id: payment.id, companyId });
                          }
                        }}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
