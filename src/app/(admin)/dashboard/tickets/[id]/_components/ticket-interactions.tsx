"use client";

import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { replyTicketAction, updateTicketStatusAction } from "@/lib/actions/tickets";
import { TICKET_STATUSES, type TicketStatus } from "@/lib/tickets/status";

export function TicketInteractions({
  ticketId,
  currentStatus,
}: {
  ticketId: string;
  currentStatus: TicketStatus;
}) {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState(currentStatus);

  const { execute: sendReply, isPending: isReplying } = useAction(replyTicketAction, {
    onSuccess: () => {
      toast.success("Resposta enviada");
      setContent("");
    },
    onError: ({ error }) => toast.error(error.serverError || "Erro ao enviar resposta"),
  });

  const { execute: changeStatus, isPending: isChangingStatus } = useAction(
    updateTicketStatusAction,
    {
      onSuccess: () => toast.success("Status atualizado"),
      onError: ({ error }) =>
        toast.error(error.serverError || "Erro ao atualizar status"),
    },
  );

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-4">
        <p className="mb-2 text-sm font-medium">Alterar status</p>
        <div className="flex gap-2">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
            className="w-full rounded-md border bg-background p-2 text-sm"
          >
            {TICKET_STATUSES.map((ticketStatus) => (
              <option key={ticketStatus} value={ticketStatus}>
                {ticketStatus}
              </option>
            ))}
          </select>
          <Button
            disabled={isChangingStatus}
            onClick={() => changeStatus({ ticketId, status })}
          >
            {isChangingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </div>
      </div>

      <div className="rounded-md border p-4">
        <p className="mb-2 text-sm font-medium">Responder chamado</p>
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Digite sua resposta"
          className="min-h-[120px]"
        />
        <div className="mt-3 flex justify-end">
          <Button
            disabled={isReplying || content.trim().length < 2}
            onClick={() => sendReply({ ticketId, content: content.trim() })}
            className="gap-2"
          >
            {isReplying && <Loader2 className="h-4 w-4 animate-spin" />}
            <Send size={16} />
            Enviar resposta
          </Button>
        </div>
      </div>
    </div>
  );
}
