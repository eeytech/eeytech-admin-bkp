"use client";

import { useEffect, useMemo, useState } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  deleteUserAction,
  getUserProfilesAction,
  toggleUserActiveAction,
  updateUserAction,
} from "@/lib/actions/users";

interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  applicationId: string;
  applicationName: string;
  isApplicationAdmin: boolean;
  companyIds: string[];
}

interface Application {
  id: string;
  name: string;
  companies: { id: string; name: string; status: string }[];
  roles: { id: string; name: string; slug: string; applicationId: string }[];
}

const editUserSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
    email: z.string().email("E-mail inválido"),
    applicationId: z.string().uuid("Aplicação inválida"),
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

type EditUserValues = z.infer<typeof editUserSchema>;

export function UserActions({
  user,
  applications,
}: {
  user: User;
  applications: Application[];
}) {
  const [showEditModal, setShowEditModal] = useState(false);

  const form = useForm<EditUserValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      applicationId: user.applicationId,
      roleIds: [],
      companyIds: user.companyIds,
      isApplicationAdmin: user.isApplicationAdmin,
    },
  });

  const selectedApplicationId = form.watch("applicationId");
  const isApplicationAdmin = form.watch("isApplicationAdmin");

  const selectedApplication = useMemo(
    () => applications.find((app) => app.id === selectedApplicationId),
    [applications, selectedApplicationId],
  );

  const availableRoles = selectedApplication?.roles ?? [];
  const availableCompanies =
    selectedApplication?.companies.filter((company) => company.status === "active") ?? [];

  const { execute: fetchProfiles } = useAction(getUserProfilesAction, {
    onSuccess: ({ data }) => {
      form.setValue("roleIds", data ?? []);
    },
    onError: () => toast.error("Erro ao carregar perfis do usuário"),
  });

  useEffect(() => {
    if (showEditModal) {
      fetchProfiles({ userId: user.id });
      form.setValue("companyIds", user.companyIds);
      form.setValue("isApplicationAdmin", user.isApplicationAdmin);
      form.setValue("applicationId", user.applicationId);
      form.setValue("name", user.name);
      form.setValue("email", user.email);
    }
  }, [
    fetchProfiles,
    form,
    showEditModal,
    user.applicationId,
    user.companyIds,
    user.email,
    user.id,
    user.isApplicationAdmin,
    user.name,
  ]);

  const { execute: updateUser, isPending: isUpdating } = useAction(updateUserAction, {
    onSuccess: () => {
      toast.success("Usuário atualizado");
      setShowEditModal(false);
    },
    onError: ({ error }) =>
      toast.error(error.serverError || "Erro ao atualizar usuário"),
  });

  const { execute: toggleActive, isPending: isToggling } = useAction(
    toggleUserActiveAction,
    {
      onSuccess: () => toast.success("Status atualizado"),
      onError: ({ error }) =>
        toast.error(error.serverError || "Erro ao atualizar status"),
    },
  );

  const { execute: deleteUser, isPending: isDeleting } = useAction(deleteUserAction, {
    onSuccess: () => toast.success("Usuário excluído"),
    onError: ({ error }) =>
      toast.error(error.serverError || "Erro ao excluir usuário"),
  });

  const submitEdit = (values: EditUserValues) => {
    updateUser({
      userId: user.id,
      name: values.name,
      email: values.email,
      applicationId: values.applicationId,
      roleIds: values.roleIds,
      companyIds: values.companyIds,
      isApplicationAdmin: values.isApplicationAdmin,
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Opções</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="gap-2 cursor-pointer"
            onClick={() => setShowEditModal(true)}
          >
            <Pencil size={14} /> Editar dados e acessos
          </DropdownMenuItem>

          <DropdownMenuItem
            className="gap-2 cursor-pointer"
            disabled={isToggling}
            onClick={() =>
              toggleActive({ userId: user.id, isActive: !user.isActive })
            }
          >
            {user.isActive ? "Desativar Conta" : "Ativar Conta"}
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive cursor-pointer"
            disabled={isDeleting}
            onClick={() => {
              if (confirm(`Excluir o usuário ${user.email}?`)) {
                deleteUser({ userId: user.id });
              }
            }}
          >
            <Trash2 className="mr-2" size={14} /> Excluir Usuário
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize os dados, perfis e empresas vinculadas.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(submitEdit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                      {availableRoles.length ? (
                        availableRoles.map((role) => {
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
                          Nenhum perfil disponível para esta aplicação.
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
                        {availableCompanies.length > 0 ? (
                          availableCompanies.map((company) => {
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
                            Nenhuma empresa ativa para esta aplicação.
                          </p>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <DialogFooter>
                <Button type="submit" disabled={isUpdating}>
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
