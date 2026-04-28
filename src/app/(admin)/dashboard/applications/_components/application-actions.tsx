"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MoreHorizontal,
  Trash2,
  PlusCircle,
  Power,
  List,
  Loader2,
  Settings,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAction } from "next-safe-action/hooks";
import {
  deleteApplicationAction,
  toggleApplicationActiveAction,
} from "@/lib/actions/applications";
import { CreateModuleModal } from "./create-module-modal";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Application {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  modules: { id: string; name: string; slug: string }[];
}

export function ApplicationActions({ app }: { app: Application }) {
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showModulesList, setShowModulesList] = useState(false);

  const { execute: deleteApp, isPending: isDeleting } = useAction(
    deleteApplicationAction,
    {
      onSuccess: () => toast.success("Aplicação excluída"),
      onError: () => toast.error("Erro ao excluir aplicação"),
    },
  );

  const { execute: toggleActive, isPending: isToggling } = useAction(
    toggleApplicationActiveAction,
    {
      onSuccess: () =>
        toast.success(
          app.isActive
            ? "Aplicação desativada com sucesso"
            : "Aplicação ativada com sucesso",
        ),
      onError: () => toast.error("Erro ao alterar status da aplicação"),
    },
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Gerenciar Aplicação</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="cursor-pointer gap-2"
            onClick={() => setShowModuleModal(true)}
          >
            <PlusCircle size={14} /> Adicionar Módulo
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer gap-2"
            onClick={() => setShowModulesList(true)}
          >
            <List size={14} /> Ver Módulos
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="cursor-pointer gap-2">
            <Link href={`/dashboard/applications/${app.id}/companies`}>
              <Building2 size={14} /> Gerenciar Empresas
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="cursor-pointer gap-2">
            <Link href={`/dashboard/applications/${app.id}/settings`}>
              <Settings size={14} /> Configurações
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer gap-2"
            disabled={isToggling}
            onClick={() =>
              toggleActive({ id: app.id, isActive: !app.isActive })
            }
          >
            {isToggling ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Power size={14} />
            )}
            {app.isActive ? "Desativar Aplicação" : "Ativar Aplicação"}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="cursor-pointer gap-2 text-destructive"
            disabled={isDeleting}
            onClick={() => {
              if (
                confirm(
                  `Tem certeza que deseja excluir "${app.name}"? Esta ação é irreversível.`,
                )
              ) {
                deleteApp({ id: app.id });
              }
            }}
          >
            <Trash2 size={14} /> {isDeleting ? "Excluindo..." : "Excluir Aplicação"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateModuleModal
        applicationId={app.id}
        open={showModuleModal}
        onOpenChange={setShowModuleModal}
      />

      <Dialog open={showModulesList} onOpenChange={setShowModulesList}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Módulos de {app.name}</DialogTitle>
            <DialogDescription>
              Lista de módulos cadastrados para esta aplicação.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
            {app.modules.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum módulo cadastrado.
              </p>
            ) : (
              app.modules.map((module) => (
                <div
                  key={module.id}
                  className="flex items-center justify-between rounded border p-2"
                >
                  <span>{module.name}</span>
                  <code className="text-xs text-muted-foreground">
                    {module.slug}
                  </code>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
