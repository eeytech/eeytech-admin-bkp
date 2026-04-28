"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Globe,
  Ticket,
  Settings,
  ShieldCheck,
  Building2,
  ChevronLeft,
  Menu,
  User,
  LogOut,
  Loader2,
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
import { toast } from "sonner";

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Aplicações", href: "/dashboard/applications", icon: Globe },
  { name: "Empresas", href: "/dashboard/companies", icon: Building2 },
  { name: "Usuários", href: "/dashboard/users", icon: Users },
  { name: "Chamados", href: "/dashboard/tickets", icon: Ticket },
  { name: "Perfis", href: "/dashboard/roles", icon: ShieldCheck },
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
        "sticky top-0 z-40 flex h-screen flex-col border-r bg-card transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <div className={cn("flex items-center justify-between p-4", isCollapsed ? "flex-col gap-4" : "p-6")}>
        {!isCollapsed && (
          <h1 className="text-xl font-bold tracking-tight text-primary truncate">
            {instanceName}
          </h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn("h-8 w-8", isCollapsed && "mt-2")}
        >
          {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.name : ""}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                isCollapsed && "justify-center px-0",
              )}
            >
              <item.icon size={20} className="shrink-0" />
              {!isCollapsed && (
                <span className="text-sm font-medium truncate">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className={cn("border-t p-4 mt-auto", isCollapsed && "px-2")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className={cn(
                "w-full flex items-center justify-start gap-3 px-2 py-6 hover:bg-accent",
                isCollapsed && "justify-center px-0"
              )}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                <User size={18} />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col items-start truncate overflow-hidden">
                  <span className="text-sm font-semibold text-foreground truncate w-full text-left">
                    Meu Perfil
                  </span>
                  <span className="text-xs text-muted-foreground truncate w-full text-left">
                    {userEmail || "Carregando..."}
                  </span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isCollapsed ? "center" : "start"} side={isCollapsed ? "right" : "top"} className="w-56">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard/profile")} className="cursor-pointer">
              <User size={14} className="mr-2" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              Logs de Acesso
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive focus:text-destructive-foreground cursor-pointer"
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
