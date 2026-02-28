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
  { name: "Aplicações", href: "/dashboard/applications", icon: Globe },
  { name: "Usuários", href: "/dashboard/users", icon: Users },
  { name: "Chamados", href: "/dashboard/tickets", icon: Ticket },
  { name: "Permissões", href: "/dashboard/roles", icon: ShieldCheck },
  { name: "Configurações", href: "/dashboard/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-card flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tight text-primary">
          Admin Eeytech
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground text-muted-foreground",
              )}
            >
              <item.icon size={18} />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center font-bold">
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
