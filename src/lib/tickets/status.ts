export const TICKET_STATUSES = [
  "Aberto",
  "Em Atendimento",
  "Resolvido",
  "Cancelado",
] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const DEFAULT_TICKET_STATUS: TicketStatus = "Aberto";

const LEGACY_STATUS_MAP: Record<string, TicketStatus> = {
  aguardando: "Aberto",
  em_atendimento: "Em Atendimento",
  concluido: "Resolvido",
};

export function normalizeTicketStatus(value?: string | null): TicketStatus {
  if (!value) return DEFAULT_TICKET_STATUS;
  if ((TICKET_STATUSES as readonly string[]).includes(value)) {
    return value as TicketStatus;
  }
  return LEGACY_STATUS_MAP[value] ?? DEFAULT_TICKET_STATUS;
}
