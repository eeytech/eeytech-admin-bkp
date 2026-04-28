"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import Link from "next/link"

interface TicketFiltersProps {
  initialFilters: {
    q?: string
    status?: string
    userId?: string
    applicationId?: string
    dateFrom?: string
    dateTo?: string
  }
  users: { id: string; name: string | null }[]
  applications: { id: string; name: string }[]
}

export function TicketFilters({ initialFilters, users, applications }: TicketFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [date, setDate] = React.useState<{ from?: string; to?: string } | undefined>({
    from: initialFilters.dateFrom,
    to: initialFilters.dateTo
  })

  // Sincroniza o estado local se os searchParams mudarem externamente (ex: Limpar)
  React.useEffect(() => {
    setDate({
      from: initialFilters.dateFrom,
      to: initialFilters.dateTo
    })
  }, [initialFilters.dateFrom, initialFilters.dateTo])

  return (
    <form action="/dashboard/tickets" method="GET" className="mb-4 grid grid-cols-1 gap-3 rounded-md border bg-card p-3 sm:grid-cols-2 lg:grid-cols-6">
      <div className="sm:col-span-2 lg:col-span-2">
        <Input
          name="q"
          placeholder="Buscar por título ou ID"
          defaultValue={initialFilters.q}
        />
      </div>

      <select
        name="applicationId"
        defaultValue={initialFilters.applicationId || "all"}
        className="rounded-md border border-input bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="all">Todas as aplicações</option>
        {applications.map((app) => (
          <option key={app.id} value={app.id}>
            {app.name}
          </option>
        ))}
      </select>

      <select
        name="status"
        defaultValue={initialFilters.status || "all"}
        className="rounded-md border border-input bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="all">Todos os status</option>
        <option value="Aberto">Aberto</option>
        <option value="Em Atendimento">Em Atendimento</option>
        <option value="Resolvido">Resolvido</option>
        <option value="Cancelado">Cancelado</option>
      </select>

      <select
        name="userId"
        defaultValue={initialFilters.userId || "all"}
        className="rounded-md border border-input bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="all">Todos os usuários</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>

      {/* DateRangePicker integrando com inputs escondidos para o Form nativo */}
      <div className="lg:col-span-2">
        <DateRangePicker 
          value={date} 
          onChange={setDate} 
          placeholder="Filtrar por período"
        />
        <input type="hidden" name="dateFrom" value={date?.from || ""} />
        <input type="hidden" name="dateTo" value={date?.to || ""} />
      </div>

      <div className="sm:col-span-2 lg:col-span-6 flex flex-col sm:flex-row justify-between items-center gap-4 pt-2 border-t">
        <div className="text-xs text-muted-foreground order-2 sm:order-1">
          {/* O contador será exibido no componente pai */}
        </div>
        <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-2">
          <Button type="submit" variant="outline" className="flex-1 sm:flex-none">
            Filtrar
          </Button>
          <Button asChild variant="ghost" className="flex-1 sm:flex-none">
            <Link href="/dashboard/tickets">Limpar</Link>
          </Button>
        </div>
      </div>
    </form>
  )
}
