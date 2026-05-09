"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MetricCard } from "@/components/ui/metric-card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BaseChart } from "@/components/charts/base-chart";
import { eventsKeys } from "@/features/events/queries/events-query-keys";
import { useEventDetailQuery } from "@/features/events/queries/use-event-detail-query";
import { EventsStatusBadge } from "@/features/events/components/events-status-badge";
import {
  buildCheckinsByHour,
  buildOutcomeData,
  formatEntryRate,
  formatMetricNumber,
} from "@/features/events/lib/event-detail-metrics";
import { allowsCheckinRegistration } from "@/features/events/lib/event-register-checkin";
import {
  checkinSimulationSchema,
  type CheckinSimulationInput,
} from "@/features/events/schemas/checkin-simulation.schema";
import { ApiError } from "@/lib/api/client";
import { postEventCheckin } from "@/services/events/events.service";
import { cn, formatDate } from "@/lib/utils";

const PIE_COLORS = ["var(--color-chart-1)", "var(--color-chart-4)"];

function ParticipantTypeBadge({ type }: { type: "vip" | "normal" }) {
  return (
    <Badge variant={type === "vip" ? "default" : "secondary"}>
      {type === "vip" ? "VIP" : "Normal"}
    </Badge>
  );
}

function ParticipantStatusBadge({ status }: { status: "inside" | "outside" }) {
  return (
    <Badge variant={status === "inside" ? "default" : "outline"}>
      {status === "inside" ? "Dentro" : "Fora"}
    </Badge>
  );
}

export function EventDetailView({ eventId }: { eventId: string }) {
  const queryClient = useQueryClient();
  const { data: queryData, isPending, isError, error, refetch, isRefetching } =
    useEventDetailQuery(eventId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CheckinSimulationInput>({
    resolver: zodResolver(checkinSimulationSchema),
    defaultValues: {
      participantId: "",
      action: "entry",
    },
  });

  const watchedParticipantId = watch("participantId");

  const checkinMutation = useMutation({
    mutationFn: (values: CheckinSimulationInput) => postEventCheckin(eventId, values),
    onSuccess: (result) => {
      if (result.event) {
        queryClient.setQueryData(eventsKeys.detail(eventId), result.event);
      }
      setSimulationResult({ success: result.ok, message: result.message });
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : "Falha ao registrar check-in.";
      setSimulationResult({ success: false, message });
    },
  });

  useEffect(() => {
    if (!queryData) {
      return;
    }
    const participant = queryData.participants.find(
      (item) => item.id === watchedParticipantId,
    );
    if (participant?.type === "normal") {
      setValue("action", "entry");
    }
  }, [queryData, watchedParticipantId, setValue]);

  const data = queryData;

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

  const checkinsByHour = buildCheckinsByHour(data.checkins);
  const outcomeData = buildOutcomeData(data.checkins);
  const selectedParticipant = data.participants.find(
    (participant) => participant.id === watchedParticipantId,
  );

  function resetSimulationForm() {
    reset();
    setSimulationResult(null);
    setIsModalOpen(false);
  }

  function onSubmitCheckin(values: CheckinSimulationInput) {
    checkinMutation.mutate(values);
  }

  const checkinAllowed = allowsCheckinRegistration(data.status);
  const closedEventNotice =
    data.status === "closed"
      ? "Este evento está encerrado. Novos check-ins estão bloqueados."
      : data.status === "cancelled"
        ? "Este evento foi cancelado. Não é possível registrar check-ins."
        : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
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

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger
            render={
              <Button
                type="button"
                disabled={!checkinAllowed}
                title={
                  !checkinAllowed ? closedEventNotice ?? "Check-in indisponível" : undefined
                }
              >
                Registrar check-in
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar check-in</DialogTitle>
              <DialogDescription>
                Registre entrada ou saída.
              </DialogDescription>
            </DialogHeader>

            <form
              className="space-y-4"
              onSubmit={(event) => void handleSubmit(onSubmitCheckin)(event)}
            >
              <div className="space-y-1.5">
                <Label htmlFor="participantId">Participante</Label>
                <select
                  id="participantId"
                  className={cn(
                    "border-input bg-background ring-offset-background",
                    "focus-visible:border-primary focus-visible:ring-primary/30",
                    "flex h-9 w-full rounded-lg border px-3 py-2 text-sm",
                    "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                  )}
                  {...register("participantId")}
                >
                  <option value="">Selecione...</option>
                  {data.participants.map((participant) => (
                    <option key={participant.id} value={participant.id}>
                      {participant.name}
                    </option>
                  ))}
                </select>
                {errors.participantId ? (
                  <p className="text-destructive text-xs">{errors.participantId.message}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="action">Ação</Label>
                <select
                  id="action"
                  className={cn(
                    "border-input bg-background ring-offset-background",
                    "focus-visible:border-primary focus-visible:ring-primary/30",
                    "flex h-9 w-full rounded-lg border px-3 py-2 text-sm",
                    "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                  )}
                  {...register("action")}
                  disabled={selectedParticipant?.type === "normal"}
                >
                  <option value="entry">Entrada</option>
                  {selectedParticipant?.type === "vip" ? (
                    <option value="exit">Saída</option>
                  ) : null}
                </select>
                {errors.action ? (
                  <p className="text-destructive text-xs">{errors.action.message}</p>
                ) : null}
              </div>

              {selectedParticipant ? (
                <div className="bg-muted rounded-lg border p-3 text-xs">
                  <p className="font-medium">{selectedParticipant.name}</p>
                  <p className="text-muted-foreground">
                    Tipo: {selectedParticipant.type === "vip" ? "VIP" : "Normal"} · Status:{" "}
                    {selectedParticipant.status === "inside" ? "Dentro (inside)" : "Fora (outside)"}
                  </p>
                </div>
              ) : null}

              {simulationResult ? (
                <div
                  className={cn(
                    "rounded-lg border p-3 text-sm",
                    simulationResult.success
                      ? "border-primary/30 bg-primary/5"
                      : "border-destructive/40 bg-destructive/5",
                  )}
                >
                  {simulationResult.message}
                </div>
              ) : null}

              <DialogFooter className="pt-1">
                <Button type="button" variant="outline" onClick={resetSimulationForm}>
                  Fechar
                </Button>
                <Button type="submit" disabled={checkinMutation.isPending || !checkinAllowed}>
                  {checkinMutation.isPending ? "Registrando..." : "Registrar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-xl sm:text-2xl font-bold">{data.name}</CardTitle>
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
          {closedEventNotice ? (
            <div
              className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100"
              role="status"
            >
              {closedEventNotice}
            </div>
          ) : null}

          {data.description ? (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {data.description}
            </p>
          ) : null}

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Participantes Esperados"
              value={formatMetricNumber(data.expected_count)}
            />
            <MetricCard
              title="Check-ins Realizados"
              value={formatMetricNumber(data.checkin_count)}
            />
            <MetricCard
              title="Tentativas com Erro"
              value={formatMetricNumber(data.error_count)}
              trend={data.error_count > 0 ? "down" : "neutral"}
            />
            <MetricCard
              title="Taxa de Entrada"
              value={formatEntryRate(data.entry_rate)}
              helperText="Percentual de entradas válidas"
              trend={data.entry_rate > 0.8 ? "up" : "neutral"}
            />
          </section>

          <Separator />

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Evolução por hora</CardTitle>
                <CardDescription>
                  Quantidade de check-ins registrados ao longo do tempo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BaseChart
                  chartType="line"
                  dataVariant="single"
                  data={checkinsByHour}
                  xKey="hour"
                  series={{ dataKey: "total", label: "Check-ins", color: "chart-1" }}
                  className="h-56 md:h-64"
                />
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Proporção sucesso/erro</CardTitle>
                <CardDescription>
                  Distribuição percentual das tentativas de check-in.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-56 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={outcomeData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label
                    >
                      {outcomeData.map((entry, index) => (
                        <Cell
                          key={`${entry.name}-${entry.value}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium">Participantes</h2>
              <p className="text-muted-foreground text-xs">
                {formatMetricNumber(data.participants.length)} cadastrados
              </p>
            </div>
            <div className="overflow-hidden rounded-xl border border-primary/20">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary/5">
                    <TableHead>Nome</TableHead>
                    <TableHead className="w-[1%]">Tipo</TableHead>
                    <TableHead className="w-[1%]">Status</TableHead>
                    <TableHead className="w-[1%] text-right">Check-ins</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.participants.map((participant) => (
                    <TableRow key={participant.id}>
                      <TableCell className="max-w-[12rem] truncate font-medium">
                        {participant.name}
                      </TableCell>
                      <TableCell>
                        <ParticipantTypeBadge type={participant.type} />
                      </TableCell>
                      <TableCell>
                        <ParticipantStatusBadge status={participant.status} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMetricNumber(participant.checkin_count)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-2 rounded-lg border bg-muted/30 p-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase">
                Participantes listados
              </p>
              <p className="mt-1 font-semibold">
                {data.participants.length === 0
                  ? "Nenhum participante listado."
                  : `${data.participants.length} no cadastro.`}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase">Check-ins</p>
              <p className="mt-1 font-semibold">
                {data.checkins.length === 0
                  ? "Nenhum check-in registrado."
                  : `${data.checkins.length} registros.`}
              </p>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
