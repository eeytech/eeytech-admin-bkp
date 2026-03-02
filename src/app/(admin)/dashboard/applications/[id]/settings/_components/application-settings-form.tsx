"use client";

import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { updateApplicationAction } from "@/lib/actions/applications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  apiKey: z.string().min(8),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export function ApplicationSettingsForm({ initialData }: { initialData: FormValues }) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  const { execute, isPending } = useAction(updateApplicationAction, {
    onSuccess: () => toast.success("Aplicacao atualizada com sucesso"),
    onError: ({ error }) => toast.error(error.serverError || "Erro ao atualizar aplicacao"),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(execute)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados gerais</CardTitle>
            <CardDescription>Atualizacao completa da aplicacao.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
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
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug / identificador</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key / identificador interno</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <select
                      value={field.value ? "true" : "false"}
                      onChange={(event) => field.onChange(event.target.value === "true")}
                      className="w-full rounded-md border bg-background p-2 text-sm"
                    >
                      <option value="true">Ativa</option>
                      <option value="false">Desativada</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" className="gap-2" disabled={isPending}>
            <Save size={16} />
            {isPending ? "Salvando..." : "Salvar alteracoes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
