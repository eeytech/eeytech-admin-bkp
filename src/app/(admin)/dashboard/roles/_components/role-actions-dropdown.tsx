"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, MoreVertical, ShieldCheck, Trash2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  deleteRoleAction,
  getRolePermissionsAction,
  updateRolePermissionsAction,
} from "@/lib/actions/roles";

const ACTIONS = ["READ", "WRITE", "DELETE", "FULL"] as const;

type Module = {
  id: string;
  name: string;
  slug: string;
};

type RoleActionsDropdownProps = {
  roleId: string;
  roleName: string;
  modules: Module[];
};

export function RoleActionsDropdown({
  roleId,
  roleName,
  modules,
}: RoleActionsDropdownProps) {
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<
    Record<string, string[]>
  >({});

  const { execute: fetchPermissions, isPending: isLoading } = useAction(
    getRolePermissionsAction,
    {
      onSuccess: ({ data }) => {
        const permissionsMap: Record<string, string[]> = {};
        data?.forEach((permission) => {
          permissionsMap[permission.moduleSlug] = permission.actions;
        });
        setSelectedPermissions(permissionsMap);
      },
      onError: () => toast.error("Erro ao carregar permissões do perfil"),
    },
  );

  const { execute: savePermissions, isPending: isSaving } = useAction(
    updateRolePermissionsAction,
    {
      onSuccess: () => {
        toast.success("Permissões do perfil atualizadas com sucesso");
        setPermissionsOpen(false);
      },
      onError: ({ error }) =>
        toast.error(error.serverError || "Erro ao salvar permissões"),
    },
  );

  const { execute: deleteRole, isPending: isDeleting } = useAction(
    deleteRoleAction,
    {
      onSuccess: () => {
        toast.success("Perfil excluído com sucesso");
        setDeleteOpen(false);
      },
      onError: ({ error }) => {
        toast.error(error.serverError || "Erro ao excluir perfil");
      },
    },
  );

  useEffect(() => {
    if (permissionsOpen) {
      fetchPermissions({ roleId });
    }
  }, [fetchPermissions, permissionsOpen, roleId]);

  const hasModules = useMemo(() => modules.length > 0, [modules]);

  const togglePermission = (moduleSlug: string, action: string) => {
    setSelectedPermissions((previous) => {
      const currentActions = previous[moduleSlug] || [];
      const nextActions = currentActions.includes(action)
        ? currentActions.filter((currentAction) => currentAction !== action)
        : [...currentActions, action];

      return {
        ...previous,
        [moduleSlug]: nextActions,
      };
    });
  };

  const handleSavePermissions = () => {
    const permissions = Object.entries(selectedPermissions).map(
      ([moduleSlug, actions]) => ({
        moduleSlug,
        actions,
      }),
    );

    savePermissions({ roleId, permissions });
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
            className="cursor-pointer gap-2"
            onClick={() => setPermissionsOpen(true)}
          >
            <ShieldCheck size={14} />
            Gerenciar Permissões
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            className="cursor-pointer"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 size={14} />
            Excluir Perfil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={permissionsOpen} onOpenChange={setPermissionsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Permissões do Perfil</DialogTitle>
            <DialogDescription>
              Defina os acessos deste perfil por módulo da aplicação.
            </DialogDescription>
          </DialogHeader>

          <div className="relative max-h-[60vh] min-h-[200px] space-y-6 overflow-y-auto border-t px-1 pt-4">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
                <Loader2 className="animate-spin text-primary" />
              </div>
            )}

            {!hasModules && !isLoading && (
              <p className="text-center text-sm text-muted-foreground">
                Esta aplicação não possui módulos cadastrados.
              </p>
            )}

            {modules.map((module) => (
              <div
                key={module.id}
                className="grid grid-cols-4 items-center gap-4 border-b pb-4"
              >
                <div className="col-span-1">
                  <p className="text-sm font-semibold">{module.name}</p>
                  <code className="font-mono text-[10px] uppercase text-muted-foreground">
                    {module.slug}
                  </code>
                </div>

                <div className="col-span-3 flex flex-wrap gap-4">
                  {ACTIONS.map((action) => (
                    <div key={action} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${roleId}-${module.slug}-${action}`}
                        checked={(selectedPermissions[module.slug] || []).includes(
                          action,
                        )}
                        onCheckedChange={() =>
                          togglePermission(module.slug, action)
                        }
                      />
                      <Label
                        htmlFor={`${roleId}-${module.slug}-${action}`}
                        className="cursor-pointer text-xs"
                      >
                        {action}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPermissionsOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSavePermissions}
              disabled={isLoading || isSaving || !hasModules}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Permissões
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Perfil</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o perfil <strong>{roleName}</strong>?
              Esta ação não pode ser desfeita e removerá os acessos de todos os
              usuários vinculados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteRole({ roleId })}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
