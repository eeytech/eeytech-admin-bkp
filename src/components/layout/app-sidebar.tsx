"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BanknoteArrowDown,
  Blocks,
  Building2,
  Building2 as BuildingAccess,
  FileText,
  Globe,
  Landmark,
  Menu,
  Receipt,
  Settings,
  ShieldCheck,
  Ticket,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type MenuItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const navigationGroups: { label: string; items: MenuItem[] }[] = [
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

const utilityItems: MenuItem[] = [
  { name: "Configurações", href: "/dashboard/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-zinc-200/80 p-6">
        <Link
          href="/dashboard/finance"
          className="flex items-center gap-3"
          onClick={() => setOpen(false)}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-300 bg-zinc-950 text-sm font-semibold text-white">
            EY
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              eeyTech
            </p>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-950">
              Admin
            </h1>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
        {navigationGroups.map((group) => (
          <div key={group.label} className="space-y-2">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href || pathname?.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all",
                      isActive
                        ? "bg-zinc-950 text-white shadow-[0_14px_30px_-18px_rgba(9,9,11,0.55)]"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
                    )}
                  >
                    <item.icon size={18} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <div className="border-t border-dashed border-zinc-200 pt-4">
          <div className="space-y-1">
            {utilityItems.map((item) => {
              const isActive =
                pathname === item.href || pathname?.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all",
                    isActive
                      ? "bg-zinc-950 text-white shadow-[0_14px_30px_-18px_rgba(9,9,11,0.55)]"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
                  )}
                >
                  <item.icon size={18} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="border-t border-zinc-200/80 p-4">
        <div className="flex items-center gap-3 rounded-2xl px-3 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100 text-sm font-semibold text-zinc-700">
            EA
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-zinc-950">
              Equipe Admin
            </span>
            <span className="truncate text-xs text-zinc-500">
              admin@eeytech.com.br
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden h-screen w-72 sticky top-0 border-r border-zinc-200/80 bg-white md:flex md:flex-col">
        <SidebarContent />
      </aside>

      <div className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-zinc-200/80 bg-white/90 px-4 backdrop-blur-md md:hidden">
        <Link href="/dashboard/finance" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-zinc-300 bg-zinc-950 text-sm font-semibold text-white">
            EY
          </div>
          <span className="font-semibold text-zinc-950">eeyTech Admin</span>
        </Link>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-zinc-700">
              <Menu size={22} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 border-r-0 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Menu de navegação</SheetTitle>
            </SheetHeader>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
      <div className="h-16 md:hidden" />
    </>
  );
}
