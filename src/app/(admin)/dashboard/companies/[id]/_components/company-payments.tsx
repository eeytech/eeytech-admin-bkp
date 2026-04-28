"use client";

import dayjs from "dayjs";
import { CreditCard, Plus, Trash2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { deletePaymentAction } from "@/lib/actions/payments";
import { CreatePaymentModal } from "./create-payment-modal";

interface CompanyPaymentsProps {
  companyId: string;
  payments: any[];
}

export function CompanyPayments({ companyId, payments: initialPayments }: CompanyPaymentsProps) {
  const { execute: deletePayment, isExecuting: isDeleting } = useAction(deletePaymentAction, {
    onSuccess: () => {
      toast.success("Pagamento removido com sucesso!");
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao remover pagamento");
    },
  });

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(amount));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 gap-1">
            <CheckCircle2 className="h-3 w-3" /> Pago
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 gap-1">
            <Clock className="h-3 w-3" /> Pendente
          </Badge>
        );
      case "overdue":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" /> Atrasado
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Histórico de Faturas e Pagamentos</h3>
        <CreatePaymentModal companyId={companyId} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data de Pagamento</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nenhum pagamento registrado.
                  </TableCell>
                </TableRow>
              ) : (
                initialPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        {payment.description || "Assinatura Mensal"}
                      </div>
                    </TableCell>
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
                          if (confirm("Deseja excluir este registro de pagamento?")) {
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
