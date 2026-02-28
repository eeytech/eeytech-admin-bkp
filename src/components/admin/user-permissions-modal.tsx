"use client";

import { useState, useMemo, useEffect } from "react"; // Adicionado useEffect
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAction } from "next-safe-action/hooks";
import { updateUserPermissionsAction, getUserPermissionsAction } from "@/lib/actions/users"; // Importada nova ação
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const ACTIONS = ["READ", "WRITE", "DELETE", "FULL"];

export function UserPermissionsModal({
  userId,
  applications,
  open,
  onOpenChange,
}: {
  userId: string;
  applications: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selectedAppId, setSelectedAppId] = useState<string>(applications[0]?.id || "");
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, string[]>>({});

  // Hook para buscar permissões existentes
  const { execute: fetchPermissions, isPending: isLoading } = useAction(getUserPermissionsAction, {
    onSuccess: ({ data }) => {
      const permsMap: Record<string, string[]> = {};
      data?.forEach(p => {
        permsMap[p.moduleSlug] = p.actions;
      });
      setSelectedPermissions(permsMap);
    },
    onError: () => toast.error("Erro ao carregar permissões atuais")
  });

  // Carrega os dados sempre que o modal abre ou troca de App
  useEffect(() => {
    if (open && selectedAppId) {
      fetchPermissions({ userId, applicationId: selectedAppId });
    }
  }, [open, selectedAppId, userId, fetchPermissions]);

  const currentApp = useMemo(() => 
    applications.find(app => app.id === selectedAppId), 
  [selectedAppId, applications]);

  const { execute: savePermissions, isPending: isSaving } = useAction(updateUserPermissionsAction, {
    onSuccess: () => {
      toast.success("Permissões atualizadas com sucesso!");
      onOpenChange(false);
    },
  });

  const togglePermission = (moduleSlug: string, action: string) => {
    setSelectedPermissions((prev) => {
      const current = prev[moduleSlug] || [];
      const newActions = current.includes(action)
        ? current.filter((a) => a !== action)
        : [...current, action];
      return { ...prev, [moduleSlug]: newActions };
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gerenciar Permissões</DialogTitle>
          <DialogDescription>Selecione o SaaS e defina os acessos do usuário.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Aplicação (SaaS)</Label>
            <select 
              className="w-full p-2 rounded-md border bg-background"
              value={selectedAppId}
              onChange={(e) => {
                setSelectedAppId(e.target.value);
                setSelectedPermissions({}); // Limpa enquanto carrega o novo
              }}
            >
              {applications.map(app => (
                <option key={app.id} value={app.id}>{app.name}</option>
              ))}
            </select>
          </div>

          <div className="border-t pt-4 space-y-6 min-h-[200px] relative">
            {isLoading && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                <Loader2 className="animate-spin text-primary" />
              </div>
            )}
            
            {currentApp?.modules.length === 0 && !isLoading && (
              <p className="text-sm text-muted-foreground text-center">Nenhum módulo cadastrado.</p>
            )}
            
            {currentApp?.modules.map((module: any) => (
              <div key={module.slug} className="grid grid-cols-4 items-center gap-4 border-b pb-4">
                <div className="col-span-1">
                  <p className="font-semibold text-sm">{module.name}</p>
                  <code className="text-[10px] text-muted-foreground uppercase">{module.slug}</code>
                </div>
                <div className="col-span-3 flex flex-wrap gap-4">
                  {ACTIONS.map((action) => (
                    <div key={action} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`${module.slug}-${action}`} 
                        checked={(selectedPermissions[module.slug] || []).includes(action)}
                        onCheckedChange={() => togglePermission(module.slug, action)}
                      />
                      <Label htmlFor={`${module.slug}-${action}`} className="text-xs cursor-pointer">{action}</Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button 
            onClick={() => {
              const permissionsArray = Object.entries(selectedPermissions).map(([slug, actions]) => ({
                moduleSlug: slug,
                actions
              }));
              savePermissions({ userId, applicationId: selectedAppId, permissions: permissionsArray });
            }} 
            disabled={isSaving || isLoading || !selectedAppId}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Permissões
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}