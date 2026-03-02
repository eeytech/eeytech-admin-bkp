"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Globe,
  Ticket,
  Settings,
  ShieldCheck,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Aplicacoes", href: "/dashboard/applications", icon: Globe },
  { name: "Usuarios", href: "/dashboard/users", icon: Users },
  { name: "Chamados", href: "/dashboard/tickets", icon: Ticket },
  { name: "Perfis", href: "/dashboard/roles", icon: ShieldCheck },
  { name: "Configuracoes", href: "/dashboard/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col border-r bg-card">
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tight text-primary">
          Admin Eeytech
        </h1>
      </div>

      <nav className="flex-1 space-y-1 px-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <item.icon size={18} />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent font-bold">
            E
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-foreground">Suporte Eeytech</span>
            <span className="text-xs">v1.0.0</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
