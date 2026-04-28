"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { useAction } from "next-safe-action/hooks";
import { z } from "zod";
import { toast } from "sonner";

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
import { createContractAction } from "@/lib/actions/contracts";

const contractSchema = z.object({
  companyId: z.string().uuid(),
  title: z.string().min(2, "Título deve ter ao menos 2 caracteres"),
  amount: z.string().min(1, "Valor mensal é obrigatório"),
  status: z.enum(["Ativo", "Cancelado", "Inadimplente"]).default("Ativo"),
  startDate: z.string().min(1, "Data de início é obrigatória"),
  dueDate: z.string().min(1, "Data de vencimento é obrigatória"),
  endDate: z.string().optional(),
  documentUrl: z.string().url("URL inválida").optional().or(z.literal("")),
});

type ContractFormInput = z.input<typeof contractSchema>;
type ContractFormValues = z.output<typeof contractSchema>;

interface CreateContractModalProps {
  companyId: string;
}

export function CreateContractModal({ companyId }: CreateContractModalProps) {
  const [open, setOpen] = useState(false);

  const defaultValues: ContractFormInput = {
    companyId,
    title: "",
    amount: "",
    status: "Ativo",
    startDate: new Date().toISOString().split("T")[0],
    dueDate: new Date().toISOString().split("T")[0],
    endDate: "",
    documentUrl: "",
  };

  const form = useForm<ContractFormInput, unknown, ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues,
  });

  const { execute, isExecuting } = useAction(createContractAction, {
    onSuccess: () => {
      toast.success("Contrato cadastrado com sucesso!");
      setOpen(false);
      form.reset(defaultValues);
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao cadastrar contrato");
    },
  });

  function onSubmit(values: ContractFormValues) {
    execute(values);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Novo contrato
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Novo contrato</DialogTitle>
          <DialogDescription>
            Registre o contrato comercial do cliente com valor, vigência e
            vencimento.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do contrato</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Plano Enterprise anual" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor mensal</FormLabel>
                    <FormControl>
                      <NumericFormat
                        customInput={Input}
                        thousandSeparator="."
                        decimalSeparator=","
                        prefix="R$ "
                        decimalScale={2}
                        fixedDecimalScale
                        value={field.value}
                        onValueChange={(values) =>
                          field.onChange(
                            typeof values.floatValue === "number"
                              ? values.floatValue.toFixed(2)
                              : "",
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <select
                      {...field}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Inadimplente">Inadimplente</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de início</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de vencimento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de encerramento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="documentUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link do documento</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isExecuting} className="bg-primary/95">
                {isExecuting ? "Salvando..." : "Cadastrar contrato"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
