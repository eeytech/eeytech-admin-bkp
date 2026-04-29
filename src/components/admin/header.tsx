"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type SessionInfo = {
  companies: { id: string; name: string }[];
  activeCompanyId: string;
};

type AdminHeaderProps = {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
};

export function AdminHeader({
  isSidebarCollapsed,
  onToggleSidebar,
}: AdminHeaderProps) {
  const router = useRouter();
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

  const companies = sessionInfo?.companies ?? [];

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="h-9 w-9 rounded-xl text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
          aria-label={isSidebarCollapsed ? "Expandir menu" : "Ocultar menu"}
        >
          {isSidebarCollapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      <div className="flex items-center gap-4">
        {companies.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">Empresa ativa:</span>
            <select
              value={sessionInfo?.activeCompanyId ?? ""}
              onChange={(event) => handleCompanyChange(event.target.value)}
              disabled={isSwitchingCompany}
              className="h-8 rounded-md border bg-background px-2 text-xs focus:ring-2 focus:ring-primary outline-none transition-all"
            >
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </header>
  );
}

