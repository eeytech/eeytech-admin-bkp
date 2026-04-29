"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BanknoteArrowDown,
  Blocks,
  Building2,
  Building2 as BuildingAccess,
  FileText,
  Globe,
  Landmark,
  Loader2,
  LogOut,
  Receipt,
  Settings,
  ShieldCheck,
  Ticket,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navigationGroups: NavGroup[] = [
  {
    label: "CRM & GestÃ£o",
    items: [
      { name: "Dashboard Financeiro", href: "/dashboard/finance", icon: Landmark },
      { name: "Empresas (Clientes)", href: "/dashboard/companies", icon: Building2 },
      { name: "Contratos", href: "/dashboard/contracts", icon: FileText },
      { name: "Receitas", href: "/dashboard/payments", icon: BanknoteArrowDown },
      { name: "Despesas", href: "/dashboard/expenses", icon: Receipt },
    ],
  },
  {
    label: "Acessos & SSO",
    items: [
      { name: "Painel SSO", href: "/dashboard", icon: Blocks },
      { name: "AplicaÃ§Ãµes", href: "/dashboard/applications", icon: Globe },
      { name: "Empresas de Acesso", href: "/dashboard/access-companies", icon: BuildingAccess },
      { name: "Perfis de Acesso", href: "/dashboard/roles", icon: ShieldCheck },
      { name: "UsuÃ¡rios", href: "/dashboard/users", icon: Users },
    ],
  },
  {
    label: "Suporte",
    items: [{ name: "Chamados", href: "/dashboard/tickets", icon: Ticket }],
  },
];

const utilityItems: NavItem[] = [
  { name: "ConfiguraÃ§Ãµes", href: "/dashboard/settings", icon: Settings },
];

type AdminSidebarProps = {
  isCollapsed: boolean;
};

export function AdminSidebar({ isCollapsed }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState("eeyCore");
  const userInitial = (userEmail?.trim().charAt(0) || "A").toUpperCase();

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const data = await response.json();
          setUserEmail(data.session?.email || "Admin");
          if (data.system?.instanceName) {
            setInstanceName(data.system.instanceName);
          }
        }
      } catch {
        // no-op
      }
    }

    void loadSession();
  }, []);

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      const response = await fetch("/api/auth/logout", { method: "POST" });

      if (response.ok) {
        toast.success("Logout realizado com sucesso");
        router.push("/login");
        router.refresh();
      } else {
        toast.error("Erro ao sair");
      }
    } catch {
      toast.error("Erro inesperado");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <aside
      className={cn(
        "sticky top-0 z-40 flex h-screen flex-col border-r border-zinc-200/80 bg-white transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[84px]" : "w-[292px]",
      )}
    >
      <div
        className={cn(
          "border-b border-zinc-200/80 px-4 py-5",
          isCollapsed ? "py-4" : "px-5",
        )}
      >
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-start")}>
          {!isCollapsed && (
            <h1 className="text-lg font-semibold tracking-tight text-zinc-950">
              {instanceName}
            </h1>
          )}

          {isCollapsed && (
            <div className="flex h-10 min-w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 px-2 text-sm font-semibold text-zinc-700">
              {instanceName.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-5">
          {navigationGroups.map((group) => (
            <div key={group.label} className="space-y-2">
              {!isCollapsed && (
                <div className="px-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
                    {group.label}
                  </p>
                </div>
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href || pathname?.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={isCollapsed ? item.name : ""}
                      className={cn(
                        "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-all",
                        isActive
                          ? "bg-zinc-950 text-white shadow-[0_14px_30px_-18px_rgba(9,9,11,0.55)]"
                          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
                        isCollapsed && "justify-center px-0",
                      )}
                    >
                      <item.icon size={18} className="shrink-0" />
                      {!isCollapsed && (
                        <span className="truncate font-medium">{item.name}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-dashed border-zinc-200 pt-4">
          <div className="space-y-1">
            {utilityItems.map((item) => {
              const isActive =
                pathname === item.href || pathname?.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isCollapsed ? item.name : ""}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-all",
                    isActive
                      ? "bg-zinc-950 text-white shadow-[0_14px_30px_-18px_rgba(9,9,11,0.55)]"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
                    isCollapsed && "justify-center px-0",
                  )}
                >
                  <item.icon size={18} className="shrink-0" />
                  {!isCollapsed && <span className="truncate font-medium">{item.name}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <div className={cn("border-t border-zinc-200/80 p-4", isCollapsed && "px-2")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "flex w-full items-center justify-start gap-3 rounded-2xl px-2 py-6 hover:bg-zinc-100",
                isCollapsed && "justify-center px-0",
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 text-zinc-700">
                <span className="text-sm font-semibold">{userInitial}</span>
              </div>
              {!isCollapsed && (
                <div className="flex min-w-0 flex-col items-start">
                  <span className="w-full truncate text-sm font-semibold text-zinc-950">
                    eeyTech
                  </span>
                  <span className="w-full truncate text-xs text-zinc-500">
                    {userEmail || "Carregando..."}
                  </span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align={isCollapsed ? "center" : "start"}
            side={isCollapsed ? "right" : "top"}
            className="w-56"
          >
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push("/dashboard/settings")}
            >
              <Settings size={14} className="mr-2" />
              Configuracoes
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:bg-destructive focus:text-destructive-foreground"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <Loader2 size={14} className="mr-2 animate-spin" />
              ) : (
                <LogOut size={14} className="mr-2" />
              )}
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
