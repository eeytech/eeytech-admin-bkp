"use client";

import { PageShell } from "@/components/admin/page-shell";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAction } from "next-safe-action/hooks";
import { updateSettingsAction } from "@/lib/actions/settings";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const settingsSchema = z.object({
  name: z.string().min(3),
  url: z.string().url(),
  sessionTimeout: z.string(),
});

type SettingsValues = z.infer<typeof settingsSchema>;

export function SettingsForm({ initialData }: { initialData: SettingsValues }) {
  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initialData,
  });

  const { execute, isExecuting } = useAction(updateSettingsAction, {
    onSuccess: () => {
      toast.success("Configurações persistidas com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao salvar no banco de dados.");
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(execute)}>
        <PageShell
          title="Configurações"
          description="Ajuste as preferências globais gravadas no banco de dados."
          action={
            <Button type="submit" className="gap-2" disabled={isExecuting}>
              <Save size={16} /> 
              {isExecuting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          }
        >
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Identidade do Sistema</CardTitle>
                <CardDescription>Configure o nome e a API da plataforma.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Instância</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL da API Central</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Segurança</CardTitle>
                <CardDescription>Sessão e expiração.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="sessionTimeout"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tempo de Expiração (minutos)</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </PageShell>
      </form>
    </Form>
  );
}