"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { useAction } from "next-safe-action/hooks";
import { z } from "zod";
import { toast } from "sonner";

import {
  createExpenseAction,
  deleteExpenseAction,
  updateExpenseAction,
} from "@/lib/actions/finance";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

const categories = [
  "Infraestrutura",
  "APIs",
  "Operacional",
  "Marketing",
  "Pessoal",
  "Tributos",
  "Outros",
] as const;

const expenseSchema = z.object({
  description: z.string().min(2, "Descrição deve ter ao menos 2 caracteres"),
  category: z.enum(categories),
  amount: z.string().min(1, "Valor é obrigatório"),
  expenseDate: z.string().min(1, "Data da despesa é obrigatória"),
});

type ExpenseFormInput = z.input<typeof expenseSchema>;
type ExpenseFormValues = z.output<typeof expenseSchema>;

type ExpenseItem = {
  id: string;
  description: string;
  category: string;
  amount: string;
  expenseDate: Date | string;
  createdAt: Date | string;
};

interface ExpensesManagerProps {
  expenses: ExpenseItem[];
}

function formatCurrency(amount: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(amount));
}

function toInputDate(value: Date | string) {
  return dayjs(value).format("YYYY-MM-DD");
}

export function ExpensesManager({ expenses }: ExpensesManagerProps) {
  const [open, setOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);

  const defaultValues: ExpenseFormInput = {
    description: "",
    category: "Infraestrutura",
    amount: "",
    expenseDate: dayjs().format("YYYY-MM-DD"),
  };

  const form = useForm<ExpenseFormInput, unknown, ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues,
  });

  const { execute: createExpense, isExecuting: isCreating } = useAction(
    createExpenseAction,
    {
      onSuccess: () => {
        toast.success("Despesa cadastrada com sucesso!");
        setOpen(false);
        setEditingExpense(null);
        form.reset(defaultValues);
      },
      onError: ({ error }) => {
        toast.error(error.serverError || "Erro ao cadastrar despesa");
      },
    },
  );

  const { execute: updateExpense, isExecuting: isUpdating } = useAction(
    updateExpenseAction,
    {
      onSuccess: () => {
        toast.success("Despesa atualizada com sucesso!");
        setOpen(false);
        setEditingExpense(null);
        form.reset(defaultValues);
      },
      onError: ({ error }) => {
        toast.error(error.serverError || "Erro ao atualizar despesa");
      },
    },
  );

  const { execute: deleteExpense, isExecuting: isDeleting } = useAction(
    deleteExpenseAction,
    {
      onSuccess: () => {
        toast.success("Despesa removida com sucesso!");
      },
      onError: ({ error }) => {
        toast.error(error.serverError || "Erro ao remover despesa");
      },
    },
  );

  const isSubmitting = isCreating || isUpdating;

  function handleCreate() {
    setEditingExpense(null);
    form.reset(defaultValues);
    setOpen(true);
  }

  function handleEdit(expense: ExpenseItem) {
    setEditingExpense(expense);
    form.reset({
      description: expense.description,
      category: expense.category as ExpenseFormInput["category"],
      amount: Number(expense.amount).toFixed(2),
      expenseDate: toInputDate(expense.expenseDate),
    });
    setOpen(true);
  }

  function onSubmit(values: ExpenseFormValues) {
    if (editingExpense) {
      updateExpense({ id: editingExpense.id, ...values });
      return;
    }

    createExpense(values);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog
          open={open}
          onOpenChange={(nextOpen) => {
            setOpen(nextOpen);
            if (!nextOpen) {
              setEditingExpense(null);
              form.reset(defaultValues);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={handleCreate} className="bg-primary/95 hover:bg-primary">
              <Plus className="mr-2 h-4 w-4" />
              Nova despesa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? "Editar despesa" : "Nova despesa"}
              </DialogTitle>
              <DialogDescription>
                Registre os custos operacionais da eeyTech no controle financeiro.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Servidor VPS principal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <select
                          {...field}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expenseDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data da despesa</FormLabel>
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
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor</FormLabel>
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

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-primary/95">
                    {isSubmitting ? "Salvando..." : editingExpense ? "Salvar alterações" : "Cadastrar despesa"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Nenhuma despesa cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{expense.category}</Badge>
                    </TableCell>
                    <TableCell>{dayjs(expense.expenseDate).format("DD/MM/YYYY")}</TableCell>
                    <TableCell>{formatCurrency(expense.amount)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(expense)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => {
                            if (confirm("Tem certeza que deseja excluir esta despesa?")) {
                              deleteExpense({ id: expense.id });
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
