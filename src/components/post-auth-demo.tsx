"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

/**
 * Fluxo de demonstração: após autenticação real, a aplicação deve enviar o usuário para /events.
 */
export function PostAuthDemo() {
  const router = useRouter();

  return (
    <Button type="button" onClick={() => router.push("/events")}>
      Simular login e ir para Eventos
    </Button>
  );
}
