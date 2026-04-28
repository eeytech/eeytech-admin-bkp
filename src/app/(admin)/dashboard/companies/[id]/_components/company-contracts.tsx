"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { FileText, Plus, Trash2, ExternalLink } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteContractAction } from "@/lib/actions/contracts";
import { CreateContractModal } from "./create-contract-modal";

interface CompanyContractsProps {
  companyId: string;
  contracts: any[];
}

export function CompanyContracts({ companyId, contracts: initialContracts }: CompanyContractsProps) {
  // We can use the initialContracts or fetch them. For simplicity, let's use props.
  
  const { execute: deleteContract, isExecuting: isDeleting } = useAction(deleteContractAction, {
    onSuccess: () => {
      toast.success("Contrato removido com sucesso!");
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao remover contrato");
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Ativo</Badge>;
      case "expired":
        return <Badge variant="secondary">Expirado</Badge>;
      case "terminated":
        return <Badge variant="destructive">Rescindido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Contratos e Documentos</h3>
        <CreateContractModal companyId={companyId} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Término</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialContracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Nenhum contrato encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                initialContracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {contract.title}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(contract.status)}</TableCell>
                    <TableCell>{dayjs(contract.startDate).format("DD/MM/YYYY")}</TableCell>
                    <TableCell>
                      {contract.endDate ? dayjs(contract.endDate).format("DD/MM/YYYY") : "Indeterminado"}
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      {contract.documentUrl && (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={contract.documentUrl} target="_blank" rel="noopener noreferrer">
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
