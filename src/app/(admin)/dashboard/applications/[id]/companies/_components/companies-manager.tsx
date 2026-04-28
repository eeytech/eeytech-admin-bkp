"use client";

import { useMemo, useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import dayjs from "dayjs";
import { Loader2, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createCompanyAction,
  deleteCompanyAction,
  toggleCompanyStatusAction,
  updateCompanyAction,
} from "@/lib/actions/companies";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const createCompanySchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  cnpj: z.string().optional(),
});

const editCompanySchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  cnpj: z.string().optional(),
});

type Company = {
  id: string;
  name: string;
  cnpj: string | null;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};

export function CompaniesManager({
  applicationId,
  companies,
}: {
  applicationId: string;
  companies: Company[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const createForm = useForm<z.infer<typeof createCompanySchema>>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: { name: "", cnpj: "" },
  });

  const editForm = useForm<z.infer<typeof editCompanySchema>>({
    resolver: zodResolver(editCompanySchema),
    defaultValues: { name: "", cnpj: "" },
  });

  const activeCount = useMemo(
    () => companies.filter((company) => company.status === "active").length,
    [companies],
  );

  const { execute: createCompany, isPending: isCreating } = useAction(
    createCompanyAction,
    {
      onSuccess: () => {
        toast.success("Empresa criada com sucesso");
        setCreateOpen(false);
        createForm.reset();
      },
      onError: ({ error }) =>
        toast.error(error.serverError || "Erro ao criar empresa"),
    },
  );

  const { execute: updateCompany, isPending: isUpdating } = useAction(
    updateCompanyAction,
    {
      onSuccess: () => {
        toast.success("Empresa atualizada");
        setEditingCompany(null);
      },
      onError: ({ error }) =>
        toast.error(error.serverError || "Erro ao atualizar empresa"),
    },
  );

  const { execute: toggleStatus, isPending: isToggling } = useAction(
    toggleCompanyStatusAction,
    {
      onSuccess: () => toast.success("Status da empresa atualizado"),
      onError: ({ error }) =>
        toast.error(error.serverError || "Erro ao atualizar status"),
    },
  );

  const { execute: deleteCompany, isPending: isDeleting } = useAction(
    deleteCompanyAction,
    {
      onSuccess: () => toast.success("Empresa excluída"),
      onError: ({ error }) =>
        toast.error(error.serverError || "Erro ao excluir empresa"),
    },
  );

  const onCreateSubmit = (values: z.infer<typeof createCompanySchema>) => {
    createCompany({
      applicationId,
      name: values.name,
      cnpj: values.cnpj,
    });
  };

  const onEditSubmit = (values: z.infer<typeof editCompanySchema>) => {
    if (!editingCompany) return;

    updateCompany({
      id: editingCompany.id,
      applicationId,
      name: values.name,
      cnpj: values.cnpj,
      status: editingCompany.status,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-md border bg-card p-4 text-sm">
        <div>
          <p>Total de empresas: {companies.length}</p>
          <p className="text-muted-foreground">Empresas ativas: {activeCount}</p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" size="sm">
              <Plus size={16} /> Nova Empresa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar empresa</DialogTitle>
              <DialogDescription>
                A empresa será vinculada a esta aplicação.
              </DialogDescription>
            </DialogHeader>

            <Form {...createForm}>
              <form
                onSubmit={createForm.handleSubmit(onCreateSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da empresa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="00.000.000/0000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar Empresa
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criada em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Nenhuma empresa cadastrada para esta aplicação.
                </TableCell>
              </TableRow>
            ) : (
              companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>{company.cnpj || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={company.status === "active" ? "default" : "secondary"}>
                      {company.status === "active" ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {dayjs(company.createdAt).format("DD/MM/YYYY")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() => {
                          setEditingCompany(company);
                          editForm.reset({
                            name: company.name,
                            cnpj: company.cnpj ?? "",
                          });
                        }}
                      >
                        <Pencil size={14} /> Editar
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        disabled={isToggling}
                        onClick={() =>
                          toggleStatus({
                            id: company.id,
                            applicationId,
                            status: company.status === "active" ? "inactive" : "active",
                          })
                        }
                      >
                        <Power size={14} />
                        {company.status === "active" ? "Desativar" : "Ativar"}
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-2"
                        disabled={isDeleting}
                        onClick={() => {
                          if (confirm(`Excluir a empresa ${company.name}?`)) {
                            deleteCompany({ id: company.id, applicationId });
                          }
                        }}
                      >
                        <Trash2 size={14} /> Excluir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={Boolean(editingCompany)}
        onOpenChange={(open) => {
          if (!open) setEditingCompany(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar empresa</DialogTitle>
            <DialogDescription>
              Atualize os dados da empresa selecionada.
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ (opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
