"use client";

import { useMemo, useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { createUserAction } from "@/lib/actions/users";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UserPlus, Loader2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const createUserSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
    email: z.string().email("E-mail inválido"),
    password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
    applicationId: z.string().uuid("Selecione uma aplicação"),
    roleIds: z.array(z.string().uuid()).min(1, "Selecione ao menos um perfil"),
    companyIds: z.array(z.string().uuid()),
    isApplicationAdmin: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.isApplicationAdmin && data.companyIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["companyIds"],
        message: "Selecione ao menos uma empresa",
      });
    }
  });

type CreateUserValues = z.infer<typeof createUserSchema>;

type ApplicationOption = {
  id: string;
  name: string;
  companies: { id: string; name: string; status: string }[];
  roles: { id: string; name: string; slug: string }[];
};

export function CreateUserModal({
  applications,
}: {
  applications: ApplicationOption[];
}) {
  const [open, setOpen] = useState(false);

  const form = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      applicationId: applications[0]?.id ?? "",
      roleIds: [],
      companyIds: [],
      isApplicationAdmin: false,
    },
  });

  const selectedApplicationId = form.watch("applicationId");
  const isApplicationAdmin = form.watch("isApplicationAdmin");

  const selectedApplication = useMemo(
    () => applications.find((application) => application.id === selectedApplicationId),
    [applications, selectedApplicationId],
  );

  const activeCompanies = selectedApplication
    ? selectedApplication.companies.filter((company) => company.status === "active")
    : [];

  const { execute, isPending } = useAction(createUserAction, {
    onSuccess: () => {
      toast.success("Usuário criado com sucesso");
      setOpen(false);
      form.reset({
        name: "",
        email: "",
        password: "",
        applicationId: applications[0]?.id ?? "",
        roleIds: [],
        companyIds: [],
        isApplicationAdmin: false,
      });
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao criar usuário");
    },
  });

  function onSubmit(values: CreateUserValues) {
    execute(values);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <UserPlus size={16} /> Novo Usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Novo Usuário</DialogTitle>
          <DialogDescription>
            Selecione aplicação, perfis e empresas para definir o acesso.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do usuário" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input placeholder="usuario@empresa.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      onChange={(event) => {
                        field.onChange(event);
                        form.setValue("roleIds", []);
                        form.setValue("companyIds", []);
                      }}
                    >
                      {applications.map((application) => (
                        <option key={application.id} value={application.id}>
                          {application.name}
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
              name="isApplicationAdmin"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3 rounded-md border p-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        const next = Boolean(checked);
                        field.onChange(next);
                        if (next) {
                          form.setValue("companyIds", []);
                        }
                      }}
                    />
                  </FormControl>
                  <div>
                    <FormLabel>Administrador Global da Aplicação</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Acesso automático a todas as empresas da aplicação.
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roleIds"
              render={() => (
                <FormItem>
                  <FormLabel>Perfis</FormLabel>
                  <div className="space-y-2 rounded-md border p-3">
                    {selectedApplication?.roles.length ? (
                      selectedApplication.roles.map((role) => {
                        const checked = form.watch("roleIds").includes(role.id);
                        return (
                          <label
                            key={role.id}
                            className="flex cursor-pointer items-center justify-between rounded border p-2"
                          >
                            <span>
                              {role.name}
                              <span className="ml-2 font-mono text-xs text-muted-foreground">
                                {role.slug}
                              </span>
                            </span>
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(nextChecked) => {
                                const current = form.getValues("roleIds");
                                form.setValue(
                                  "roleIds",
                                  nextChecked
                                    ? [...current, role.id]
                                    : current.filter((id) => id !== role.id),
                                  { shouldValidate: true },
                                );
                              }}
                            />
                          </label>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Nenhum perfil disponível para a aplicação selecionada.
                      </p>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isApplicationAdmin && (
              <FormField
                control={form.control}
                name="companyIds"
                render={() => (
                  <FormItem>
                    <FormLabel>Empresas</FormLabel>
                    <div className="space-y-2 rounded-md border p-3">
                      {activeCompanies.length > 0 ? (
                        activeCompanies.map((company) => {
                          const checked = form.watch("companyIds").includes(company.id);
                          return (
                            <label
                              key={company.id}
                              className="flex cursor-pointer items-center justify-between rounded border p-2"
                            >
                              <span>{company.name}</span>
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(nextChecked) => {
                                  const current = form.getValues("companyIds");
                                  form.setValue(
                                    "companyIds",
                                    nextChecked
                                      ? [...current, company.id]
                                      : current.filter((id) => id !== company.id),
                                    { shouldValidate: true },
                                  );
                                }}
                              />
                            </label>
                          );
                        })
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Nenhuma empresa ativa para a aplicação selecionada.
                        </p>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Usuário
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
