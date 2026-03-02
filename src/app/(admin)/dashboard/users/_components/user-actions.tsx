"use client";

import { useState } from "react";
import { MoreVertical, Pencil, ShieldAlert, Trash2 } from "lucide-react";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UserPermissionsModal } from "@/components/admin/user-permissions-modal";
import { deleteUserAction, toggleUserActiveAction, updateUserAction } from "@/lib/actions/users";

interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  applicationId: string;
  applicationName: string;
}

interface Application {
  id: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
  slug: string;
  applicationId: string;
}

const editUserSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  email: z.string().email("E-mail invalido"),
  applicationId: z.string().uuid("Aplicacao invalida"),
});

type EditUserValues = z.infer<typeof editUserSchema>;

export function UserActions({
  user,
  applications,
  roles,
}: {
  user: User;
  applications: Application[];
  roles: Role[];
}) {
  const [showProfilesModal, setShowProfilesModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const form = useForm<EditUserValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      applicationId: user.applicationId,
    },
  });

  const currentAppId = form.watch("applicationId");
  const availableRoles = roles.filter((role) => role.applicationId === user.applicationId);
  const selectedApplication = applications.find((app) => app.id === user.applicationId);

  const { execute: updateUser, isPending: isUpdating } = useAction(updateUserAction, {
    onSuccess: () => {
      toast.success("Usuario atualizado");
      setShowEditModal(false);
    },
    onError: ({ error }) =>
      toast.error(error.serverError || "Erro ao atualizar usuario"),
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
    onSuccess: () => toast.success("Usuario excluido"),
    onError: ({ error }) =>
      toast.error(error.serverError || "Erro ao excluir usuario"),
  });

  const submitEdit = (values: EditUserValues) => {
    updateUser({
      userId: user.id,
      name: values.name,
      email: values.email,
      applicationId: values.applicationId,
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
          <DropdownMenuLabel>Opcoes</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="gap-2 cursor-pointer"
            onClick={() => setShowEditModal(true)}
          >
            <Pencil size={14} /> Editar dados
          </DropdownMenuItem>

          <DropdownMenuItem
            className="gap-2 cursor-pointer"
            onClick={() => setShowProfilesModal(true)}
          >
            <ShieldAlert size={14} /> Editar Perfis
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
              if (confirm(`Excluir o usuario ${user.email}?`)) {
                deleteUser({ userId: user.id });
              }
            }}
          >
            <Trash2 className="mr-2" size={14} /> Excluir Usuario
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Atualize os dados basicos e a aplicacao vinculada.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(submitEdit)} className="space-y-4">
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

              <FormField
                control={form.control}
                name="applicationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aplicacao</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full rounded-md border bg-background p-2 text-sm"
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

              {currentAppId !== user.applicationId && (
                <p className="text-xs text-muted-foreground">
                  Trocar a aplicacao remove os perfis atuais do usuario.
                </p>
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

      <UserPermissionsModal
        userId={user.id}
        applicationName={selectedApplication?.name ?? user.applicationName}
        roles={availableRoles}
        open={showProfilesModal}
        onOpenChange={setShowProfilesModal}
      />
    </>
  );
}
