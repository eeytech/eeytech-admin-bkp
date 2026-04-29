"use client"

import * as React from "react"

import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Input } from "@/components/ui/input"

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
  const formRef = React.useRef<HTMLFormElement>(null)
  const firstQueryRenderRef = React.useRef(true)
  const firstDateRenderRef = React.useRef(true)
  const syncingQueryFromPropsRef = React.useRef(false)
  const syncingDateFromPropsRef = React.useRef(false)

  const [query, setQuery] = React.useState(initialFilters.q ?? "")
  const [date, setDate] = React.useState<{ from?: string; to?: string } | undefined>({
    from: initialFilters.dateFrom,
    to: initialFilters.dateTo,
  })

  React.useEffect(() => {
    syncingQueryFromPropsRef.current = true
    setQuery(initialFilters.q ?? "")
  }, [initialFilters.q])

  React.useEffect(() => {
    syncingDateFromPropsRef.current = true
    setDate({
      from: initialFilters.dateFrom,
      to: initialFilters.dateTo,
    })
  }, [initialFilters.dateFrom, initialFilters.dateTo])

  React.useEffect(() => {
    if (firstQueryRenderRef.current) {
      firstQueryRenderRef.current = false
      return
    }

    if (syncingQueryFromPropsRef.current) {
      syncingQueryFromPropsRef.current = false
      return
    }

    const timeout = window.setTimeout(() => {
      formRef.current?.requestSubmit()
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [query])

  React.useEffect(() => {
    if (firstDateRenderRef.current) {
      firstDateRenderRef.current = false
      return
    }

    if (syncingDateFromPropsRef.current) {
      syncingDateFromPropsRef.current = false
      return
    }

    formRef.current?.requestSubmit()
  }, [date])

  const submitFilters = () => {
    formRef.current?.requestSubmit()
  }

  return (
    <form
      ref={formRef}
      action="/dashboard/tickets"
      method="GET"
      className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-12 xl:items-center"
    >
      <div className="sm:col-span-2 xl:col-span-3">
        <Input
          name="q"
          placeholder="Buscar por título ou ID"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-9"
        />
      </div>

      <select
        name="applicationId"
        defaultValue={initialFilters.applicationId || "all"}
        onChange={submitFilters}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring xl:col-span-2"
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
        onChange={submitFilters}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring xl:col-span-2"
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
        onChange={submitFilters}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring xl:col-span-3"
      >
        <option value="all">Todos os usuários</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>

      <div className="xl:col-span-2">
        <DateRangePicker
          value={date}
          onChange={setDate}
          placeholder="Período"
        />
        <input type="hidden" name="dateFrom" value={date?.from || ""} />
        <input type="hidden" name="dateTo" value={date?.to || ""} />
      </div>
    </form>
  )
}
