"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useEventDetailQuery } from "@/features/events/queries/use-event-detail-query";
import { EventsStatusBadge } from "@/features/events/components/events-status-badge";
import { ApiError } from "@/lib/api/client";
import { cn, formatDate } from "@/lib/utils";

export function EventDetailView({ eventId }: { eventId: string }) {
  const { data, isPending, isError, error, refetch, isRefetching } =
    useEventDetailQuery(eventId);

  if (isPending) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground"
        aria-busy
        aria-live="polite"
      >
        <Loader2 className="size-8 animate-spin" aria-hidden />
        <p className="text-sm">Carregando evento…</p>
      </div>
    );
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Evento não encontrado</CardTitle>
            <CardDescription>
              Não existe um evento com o identificador informado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/events"
              className={buttonVariants({ variant: "outline" })}
            >
              Voltar para eventos
            </Link>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle>Não foi possível carregar</CardTitle>
          <CardDescription>
            {error instanceof Error ? error.message : "Erro ao buscar o evento."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            onClick={() => void refetch()}
            disabled={isRefetching}
          >
            {isRefetching ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Tentando…
              </>
            ) : (
              "Tentar novamente"
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/events"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2 inline-flex gap-1",
          )}
        >
          <ArrowLeft className="size-4" aria-hidden />
          Eventos
        </Link>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-xl sm:text-2xl">{data.name}</CardTitle>
              <CardDescription className="text-sm">
                <time dateTime={data.date}>{formatDate(data.date)}</time>
                <span className="text-muted-foreground/80"> · </span>
                <span>{data.location}</span>
              </CardDescription>
            </div>
            <EventsStatusBadge status={data.status} className="self-start" />
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="space-y-4 pt-6">
          {data.description ? (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {data.description}
            </p>
          ) : null}

          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Participantes esperados
              </dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">
                {new Intl.NumberFormat("pt-BR").format(data.expected_count)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Check-ins
              </dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">
                {new Intl.NumberFormat("pt-BR").format(data.checkin_count)}
              </dd>
            </div>
          </dl>

          <Separator />

          <div>
            <h2 className="mb-2 text-sm font-medium">Participantes</h2>
            <p className="text-muted-foreground text-sm">
              {data.participants.length === 0
                ? "Nenhum participante listado."
                : `${data.participants.length} no cadastro.`}
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-medium">Check-ins</h2>
            <p className="text-muted-foreground text-sm">
              {data.checkins.length === 0
                ? "Nenhum check-in registrado."
                : `${data.checkins.length} registros.`}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
