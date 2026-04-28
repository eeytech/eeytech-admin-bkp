"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteRoleAction } from "@/lib/actions/roles";

export function RoleDeleteButton({ roleId, roleName }: { roleId: string; roleName: string }) {
  const [open, setOpen] = useState(false);

  const { execute, isPending } = useAction(deleteRoleAction, {
    onSuccess: () => {
      toast.success("Perfil excluído com sucesso");
      setOpen(false);
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao excluir perfil");
    },
  });

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Perfil</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o perfil <strong>{roleName}</strong>? 
              Esta ação não pode ser desfeita e removerá os acessos de todos os usuários vinculados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => execute({ roleId })}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
