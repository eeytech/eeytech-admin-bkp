"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAction } from "next-safe-action/hooks";
import { createApplicationAction } from "@/lib/actions/applications";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { PlusCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(3, "Mínimo 3 caracteres"),
  slug: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas e hífens"),
});

export function CreateAppModal() {
  const [open, setOpen] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", slug: "" },
  });

  // Alterado: useAction agora utiliza isPending e onError detalhado
  const { execute, isPending } = useAction(createApplicationAction, {
    onSuccess: () => {
      toast.success("Aplicação criada com sucesso!");
      setOpen(false);
      form.reset();
    },
    onError: ({ error }) => {
      console.error("Erro ao criar aplicação:", error);
      toast.error(error.serverError || "Erro ao criar aplicação. Verifique os dados.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <PlusCircle size={16} /> Nova Aplicação
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar Nova Aplicação</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(execute)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Aplicação</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Clínica SaaS" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug (ID Único)</FormLabel>
                  <FormControl>
                    <Input placeholder="clinica-saas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Criando..." : "Criar Aplicação"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}