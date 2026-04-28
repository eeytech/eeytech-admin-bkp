"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { getUserProfilesAction, updateUserProfilesAction } from "@/lib/actions/users";
import { toast } from "sonner";

type Role = {
  id: string;
  name: string;
  slug: string;
};

export function UserPermissionsModal({
  userId,
  applicationName,
  roles,
  open,
  onOpenChange,
}: {
  userId: string;
  applicationName: string;
  roles: Role[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  const { execute: fetchProfiles, isPending: isLoading } = useAction(
    getUserProfilesAction,
    {
      onSuccess: ({ data }) => setSelectedRoleIds(data ?? []),
      onError: () => toast.error("Erro ao carregar perfis do usuário"),
    },
  );

  const { execute: saveProfiles, isPending: isSaving } = useAction(
    updateUserProfilesAction,
    {
      onSuccess: () => {
        toast.success("Perfis atualizados com sucesso");
        onOpenChange(false);
      },
      onError: ({ error }) =>
        toast.error(error.serverError || "Erro ao atualizar perfis"),
    },
  );

  useEffect(() => {
    if (open) {
      fetchProfiles({ userId });
    }
  }, [open, userId, fetchProfiles]);

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((previous) =>
      previous.includes(roleId)
        ? previous.filter((id) => id !== roleId)
        : [...previous, roleId],
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Perfis</DialogTitle>
          <DialogDescription>
            Selecione os perfis para a aplicação {applicationName}.
          </DialogDescription>
        </DialogHeader>

        <div className="relative min-h-[180px] max-h-[60vh] overflow-y-auto space-y-4 border-t pt-4 pr-2">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
              <Loader2 className="animate-spin text-primary" />
            </div>
          )}

          {roles.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground">
              Nenhum perfil cadastrado para esta aplicação.
            </p>
          )}

          {roles.map((role) => (
            <div key={role.id} className="flex items-center gap-3 rounded border p-3">
              <Checkbox
                id={`${userId}-${role.id}`}
                checked={selectedRoleIds.includes(role.id)}
                onCheckedChange={() => toggleRole(role.id)}
              />
              <div className="flex flex-col">
                <Label htmlFor={`${userId}-${role.id}`} className="cursor-pointer">
                  {role.name}
                </Label>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {role.slug}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={isLoading || isSaving}
            onClick={() => saveProfiles({ userId, roleIds: selectedRoleIds })}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Perfis
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
