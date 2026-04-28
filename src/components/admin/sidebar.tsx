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
  ChevronLeft,
  FileText,
  Globe,
  Landmark,
  Loader2,
  LogOut,
  Menu,
  Receipt,
  Settings,
  ShieldCheck,
  Ticket,
  User,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
    label: "CRM & Gestão",
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
      { name: "Aplicações", href: "/dashboard/applications", icon: Globe },
      { name: "Empresas de Acesso", href: "/dashboard/access-companies", icon: BuildingAccess },
      { name: "Perfis de Acesso", href: "/dashboard/roles", icon: ShieldCheck },
      { name: "Usuários", href: "/dashboard/users", icon: Users },
    ],
  },
  {
    label: "Suporte",
    items: [{ name: "Chamados", href: "/dashboard/tickets", icon: Ticket }],
  },
];

const utilityItems: NavItem[] = [
  { name: "Configurações", href: "/dashboard/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState("eeyCore");

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
          isCollapsed ? "flex flex-col items-center gap-4" : "px-5",
        )}
      >
        <div className={cn("flex items-center justify-between", isCollapsed && "w-full flex-col gap-4")}>
          {!isCollapsed && (
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-300 bg-zinc-950 text-sm font-semibold text-white">
                  EY
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    eeyTech
                  </p>
                  <h1 className="text-lg font-semibold tracking-tight text-zinc-950">
                    {instanceName}
                  </h1>
                </div>
              </div>
              <p className="text-xs text-zinc-500">
                CRM, identidade e suporte em um único painel.
              </p>
            </div>
          )}

          {isCollapsed && (
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-300 bg-zinc-950 text-sm font-semibold text-white">
              EY
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-9 w-9 rounded-xl text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
          >
            {isCollapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
          </Button>
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
                <User size={18} />
              </div>
              {!isCollapsed && (
                <div className="flex min-w-0 flex-col items-start">
                  <span className="w-full truncate text-sm font-semibold text-zinc-950">
                    Minha conta
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
            <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/profile")}
              className="cursor-pointer"
            >
              <User size={14} className="mr-2" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              Logs de acesso
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
