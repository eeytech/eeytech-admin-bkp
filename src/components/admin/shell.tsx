"use client";

import { useState } from "react";

import { AdminHeader } from "@/components/admin/header";
import { AdminSidebar } from "@/components/admin/sidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen">
      <AdminSidebar isCollapsed={isSidebarCollapsed} />
      <div className="flex flex-1 flex-col">
        <AdminHeader
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed((current) => !current)}
        />
        <main>{children}</main>
      </div>
    </div>
  );
}
