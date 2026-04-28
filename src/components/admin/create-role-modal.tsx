"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { createRoleAction } from "@/lib/actions/roles";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(3, "Nome muito curto"),
  applicationId: z.string().uuid("Selecione uma aplicação"),
  description: z.string().optional(),
});

export function CreateRoleModal({
  applications,
}: {
  applications: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      applicationId: applications[0]?.id || "",
      description: "",
    },
  });

  const { execute, isPending } = useAction(createRoleAction, {
    onSuccess: () => {
      toast.success("Perfil criado com sucesso");
      setOpen(false);
      form.reset();
    },
    onError: ({ error }) =>
      toast.error(error.serverError || "Erro ao criar perfil"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus size={16} /> Novo Perfil
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Novo Perfil</DialogTitle>
          <DialogDescription>
            Defina um perfil de acesso para uma aplicação específica.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(execute)} className="space-y-4">
            <FormField
              control={form.control}
              name="applicationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aplicação</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="w-full rounded-md border bg-background p-2 text-sm"
                    >
                      {applications.map((app) => (
                        <option key={app.id} value={app.id}>
                          {app.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Perfil</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Visualizador" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva as responsabilidades deste perfil"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Perfil
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
