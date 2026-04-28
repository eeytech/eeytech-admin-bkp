"use client"

import * as React from "react"
import { format, parseISO } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { DateRange } from "react-day-picker"
import { ptBR } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  className?: React.HTMLAttributes<HTMLDivElement>["className"]
  value?: { from?: string; to?: string }
  onChange?: (range: { from?: string; to?: string } | undefined) => void
  placeholder?: string
}

/**
 * Componente DateRangePicker customizado para filtros de período.
 * 
 * DESIGN:
 * - Minimalista, limpo, utilizando a fonte Inter.
 * - Cores: Destaque em bordô (#8c3531 com 95% opacidade).
 * 
 * REGRA DE NEGÓCIO (Timezone-agnostic):
 * - Trata as datas como strings "YYYY-MM-DD" para evitar desvios de fuso horário
 *   entre o cliente e o servidor/banco de dados.
 */
export function DateRangePicker({
  className,
  value,
  onChange,
  placeholder = "Selecione um período",
}: DateRangePickerProps) {
  
  // Converte as strings YYYY-MM-DD para objetos Date locais para o react-day-picker
  const dateRange: DateRange | undefined = React.useMemo(() => {
    if (!value?.from) return undefined
    
    return {
      from: parseISO(value.from),
      to: value.to ? parseISO(value.to) : undefined
    }
  }, [value])

  const handleSelect = (range: DateRange | undefined) => {
    if (!range) {
      onChange?.(undefined)
      return
    }

    // Converte de volta para string YYYY-MM-DD mantendo o valor exato selecionado
    const newValue = {
      from: range.from ? format(range.from, "yyyy-MM-dd") : undefined,
      to: range.to ? format(range.to, "yyyy-MM-dd") : undefined
    }

    onChange?.(newValue as { from?: string; to?: string })
  }

  const clearDate = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.(undefined)
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal border-border/50 hover:bg-accent/50 transition-colors group relative",
              !value?.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
            <span className="truncate">
              {value?.from ? (
                value.to ? (
                  <>
                    {format(parseISO(value.from), "dd/MM/yyyy")} - {format(parseISO(value.to), "dd/MM/yyyy")}
                  </>
                ) : (
                  format(parseISO(value.from), "dd/MM/yyyy")
                )
              ) : (
                <span>{placeholder}</span>
              )}
            </span>
            
            {value?.from && (
              <X 
                className="ml-auto h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity hover:opacity-100" 
                onClick={clearDate}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-border/50 shadow-xl" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleSelect}
            numberOfMonths={2}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
