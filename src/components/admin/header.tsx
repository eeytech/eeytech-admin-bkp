"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Loader2 } from "lucide-react";
import { toast } from "sonner";

type SessionInfo = {
  companies: { id: string; name: string }[];
  activeCompanyId: string;
};

export function AdminHeader() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitchingCompany, setIsSwitchingCompany] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        if (!response.ok) return;

        const data = await response.json();
        if (!mounted) return;

        setSessionInfo({
          companies: data.session?.companies ?? [],
          activeCompanyId: data.session?.activeCompanyId ?? "",
        });
      } catch {
        // no-op
      }
    }

    void loadSession();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleCompanyChange(nextCompanyId: string) {
    if (!sessionInfo || nextCompanyId === sessionInfo.activeCompanyId) {
      return;
    }

    try {
      setIsSwitchingCompany(true);

      const response = await fetch("/api/auth/company-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: nextCompanyId }),
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel trocar a empresa ativa");
      }

      setSessionInfo({ ...sessionInfo, activeCompanyId: nextCompanyId });
      toast.success("Empresa ativa atualizada");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Erro ao trocar empresa");
    } finally {
      setIsSwitchingCompany(false);
    }
  }

  async function handleLogout() {
    try {
      setIsLoading(true);

      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Logout realizado com sucesso");
        router.push("/login");
        router.refresh();
      } else {
        toast.error("Erro ao sair. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro no logout:", error);
      toast.error("Ocorreu um erro inesperado.");
    } finally {
      setIsLoading(false);
    }
  }

  const companies = sessionInfo?.companies ?? [];

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          Bem-vindo ao painel central
        </span>
      </div>

      <div className="flex items-center gap-4">
        {companies.length > 1 && (
          <select
            value={sessionInfo?.activeCompanyId ?? ""}
            onChange={(event) => handleCompanyChange(event.target.value)}
            disabled={isSwitchingCompany}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full border">
              <User size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem>Logs de Acesso</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive focus:text-destructive-foreground cursor-pointer"
              onClick={handleLogout}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

