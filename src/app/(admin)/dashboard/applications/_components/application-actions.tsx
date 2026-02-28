"use client";

import { useState } from "react";
import { MoreHorizontal, Trash2, PlusCircle, Copy, Check, Settings, ExternalLink } from "lucide-react";
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
import { deleteApplicationAction } from "@/lib/actions/applications";
import { CreateModuleModal } from "./create-module-modal";
import { toast } from "sonner";

interface Application {
  id: string;
  name: string;
  slug: string;
  apiKey: string;
}

export function ApplicationActions({ app }: { app: Application }) {
  const [copied, setCopied] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  
  const { execute: deleteApp, isPending: isDeleting } = useAction(deleteApplicationAction, {
    onSuccess: () => toast.success("Aplicação excluída."),
    onError: () => toast.error("Erro ao excluir aplicação.")
  });

  const copyApiKey = () => {
    navigator.clipboard.writeText(app.apiKey);
    setCopied(true);
    toast.success("API Key copiada para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="icon" onClick={copyApiKey} className="h-8 w-8">
          {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-muted-foreground" />}
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Gerenciar SaaS</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => setShowModuleModal(true)}>
              <PlusCircle size={14} /> Adicionar Módulo
            </DropdownMenuItem>
            
            <DropdownMenuItem className="gap-2 cursor-pointer" disabled>
              <Settings size={14} /> Configurações
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              className="text-destructive gap-2 cursor-pointer"
              disabled={isDeleting}
              onClick={() => {
                if (confirm(`Tem certeza que deseja excluir "${app.name}"? Esta ação é irreversível.`)) {
                  deleteApp({ id: app.id });
                }
              }}
            >
              <Trash2 size={14} /> {isDeleting ? "Excluindo..." : "Excluir Aplicação"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CreateModuleModal 
        applicationId={app.id} 
        open={showModuleModal} 
        onOpenChange={setShowModuleModal} 
      />
    </>
  );
}