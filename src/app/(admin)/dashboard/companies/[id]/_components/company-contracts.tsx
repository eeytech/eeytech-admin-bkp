"use client";

import dayjs from "dayjs";
import { ExternalLink, FileText, Trash2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { deleteContractAction } from "@/lib/actions/contracts";
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
import { CreateContractModal } from "./create-contract-modal";

interface ContractItem {
  id: string;
  title: string;
  amount: string;
  status: string;
  startDate: Date | string;
  dueDate: Date | string;
  endDate: Date | string | null;
  documentUrl: string | null;
}

interface CompanyContractsProps {
  companyId: string;
  contracts: ContractItem[];
}

function formatCurrency(amount: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(amount));
}

function getStatusBadge(status: string) {
  switch (status) {
    case "Ativo":
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Ativo</Badge>;
    case "Inadimplente":
      return <Badge variant="destructive">Inadimplente</Badge>;
    case "Cancelado":
      return <Badge variant="secondary">Cancelado</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function CompanyContracts({
  companyId,
  contracts: initialContracts,
}: CompanyContractsProps) {
  const { execute: deleteContract, isExecuting: isDeleting } = useAction(
    deleteContractAction,
    {
      onSuccess: () => {
        toast.success("Contrato removido com sucesso!");
      },
      onError: ({ error }) => {
        toast.error(error.serverError || "Erro ao remover contrato");
      },
    },
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Contratos do cliente</h3>
          <p className="text-sm text-muted-foreground">
            Controle o valor contratado, vencimento e documentação comercial.
          </p>
        </div>
        <CreateContractModal companyId={companyId} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contrato</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialContracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nenhum contrato encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                initialContracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span>{contract.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {contract.endDate
                              ? `Encerramento em ${dayjs(contract.endDate).format("DD/MM/YYYY")}`
                              : "Sem data de encerramento"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(contract.amount)}</TableCell>
                    <TableCell>{getStatusBadge(contract.status)}</TableCell>
                    <TableCell>{dayjs(contract.startDate).format("DD/MM/YYYY")}</TableCell>
                    <TableCell>{dayjs(contract.dueDate).format("DD/MM/YYYY")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {contract.documentUrl && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={contract.documentUrl} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => {
                            if (confirm("Tem certeza que deseja excluir este contrato?")) {
                              deleteContract({ id: contract.id, companyId });
                            }
                          }}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
