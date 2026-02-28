"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * Provedor do React Query configurado para o ambiente Next.js (App Router).
 * Utiliza o hook useState para garantir que o QueryClient seja instanciado apenas uma vez no cliente.
 */
export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Define o tempo que os dados são considerados "frescos" antes de uma nova busca (1 minuto)
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}