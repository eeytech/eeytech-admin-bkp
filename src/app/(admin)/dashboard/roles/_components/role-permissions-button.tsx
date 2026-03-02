"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  getRolePermissionsAction,
  updateRolePermissionsAction,
} from "@/lib/actions/roles";

const ACTIONS = ["READ", "WRITE", "DELETE", "FULL"] as const;

type Module = {
  id: string;
  name: string;
  slug: string;
};

type RolePermissionsButtonProps = {
  roleId: string;
  modules: Module[];
};

export function RolePermissionsButton({
  roleId,
  modules,
}: RolePermissionsButtonProps) {
  const [open, setOpen] = useState(false);
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
      onError: () => toast.error("Erro ao carregar permissões do papel"),
    },
  );

  const { execute: savePermissions, isPending: isSaving } = useAction(
    updateRolePermissionsAction,
    {
      onSuccess: () => {
        toast.success("Permissões do papel atualizadas com sucesso!");
        setOpen(false);
      },
      onError: ({ error }) =>
        toast.error(error.serverError || "Erro ao salvar permissões"),
    },
  );

  useEffect(() => {
    if (open) {
      fetchPermissions({ roleId });
    }
  }, [open, roleId, fetchPermissions]);

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

  const handleSave = () => {
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
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Gerenciar Permissões
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Permissões do Papel</DialogTitle>
            <DialogDescription>
              Defina os acessos deste papel por módulo da aplicação.
            </DialogDescription>
          </DialogHeader>

          <div className="relative min-h-[200px] space-y-6 border-t pt-4">
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

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading || isSaving || !hasModules}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Permissões
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
