"use client";

import { useState } from "react";
import { MoreVertical, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserPermissionsModal } from "@/components/admin/user-permissions-modal";

interface User {
  id: string;
  email: string;
  isActive: boolean | null;
}

// Interface para as aplicações que vêm do servidor
interface Application {
  id: string;
  name: string;
  slug: string;
  modules: { id: string; name: string; slug: string }[];
}

export function UserActions({ user, applications }: { user: User; applications: Application[] }) {
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

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
            onClick={() => setShowPermissionsModal(true)}
          >
            <ShieldAlert size={14} /> Editar Permissões
          </DropdownMenuItem>
          
          <DropdownMenuItem className="gap-2 cursor-pointer">
            {user.isActive ? "Desativar Conta" : "Ativar Conta"}
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive cursor-pointer">
            Excluir Usuário
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UserPermissionsModal
        userId={user.id}
        applications={applications} // Passamos a lista completa
        open={showPermissionsModal}
        onOpenChange={setShowPermissionsModal}
      />
    </>
  );
}