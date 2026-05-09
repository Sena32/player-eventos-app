"use client";

import {
  ArrowDownAZ,
  ArrowUpAZ,
  Calendar,
  ChevronRight,
  Filter,
  Loader2,
  MapPin,
  Search,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  filterAndSortEvents,
  type EventDateSort,
} from "@/features/events/lib/filter-sort-events";
import { useEventsListQuery } from "@/features/events/queries/use-events-list-query";
import type { EventStatus } from "@/features/events/schemas/events.schema";
import { EventsStatusBadge } from "@/features/events/components/events-status-badge";
import { useDebounce } from "@/hooks/use-debounce";
import { cn, formatDate } from "@/lib/utils";

const sortLabels: Record<EventDateSort, string> = {
  asc: "Data: mais antiga primeiro",
  desc: "Data: mais recente primeiro",
};

function parseStatus(value: string | null): EventStatus | "" {
  if (value === "active" || value === "closed" || value === "cancelled") {
    return value;
  }
  return "";
}

function parseOrdem(value: string | null): EventDateSort {
  return value === "desc" ? "desc" : "asc";
}

function formatParticipants(n: number): string {
  return new Intl.NumberFormat("pt-BR").format(n);
}

const filterInputClass =
  "h-10 min-h-10 border-primary/30 bg-background py-0 pr-3 pl-9 text-sm leading-snug";

const filterSelectClass = cn(
  "border-primary/30 bg-background text-sm ring-offset-background",
  "focus-visible:border-primary focus-visible:ring-primary/30",
  "box-border flex h-10 min-h-10 w-full rounded-lg border px-3 leading-snug",
  "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
);

export function EventsListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        <div className="flex min-w-0 flex-1 gap-2 lg:max-w-md">
          <Skeleton className="h-10 min-w-0 flex-1" />
          <Skeleton className="h-10 w-10 shrink-0 lg:hidden" />
        </div>
        <Skeleton className="hidden h-10 w-full sm:w-44 lg:block" />
        <Skeleton className="hidden h-10 w-full sm:min-w-[14rem] sm:max-w-xs lg:block" />
      </div>
      <div className="hidden rounded-xl border md:block">
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
      <div className="flex flex-col gap-3 md:hidden">
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-36 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function EventsList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlQ = searchParams.get("q") ?? "";
  const [inputQ, setInputQ] = useState(urlQ);
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);
  const debouncedQ = useDebounce(inputQ, 400);

  // Sincroniza o campo com a URL (ex.: voltar no navegador, link compartilhado).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- espelhar searchParams na entrada quando a URL muda externamente
    setInputQ(urlQ);
  }, [urlQ]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams.toString());
    const trimmed = debouncedQ.trim();
    if (trimmed) {
      next.set("q", trimmed);
    } else {
      next.delete("q");
    }
    if (next.toString() === searchParams.toString()) {
      return;
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [debouncedQ, pathname, router, searchParams]);

  const statusFilter = parseStatus(searchParams.get("status"));
  const dateSort = parseOrdem(searchParams.get("ordem"));

  const { data, isPending, isError, error, refetch, isRefetching } =
    useEventsListQuery();
  const filtered = useMemo(() => {
    const list = data?.data ?? [];
    return filterAndSortEvents(list, {
      q: debouncedQ,
      status: statusFilter,
      dateSort,
    });
  }, [data, debouncedQ, statusFilter, dateSort]);

  const hasSourceData = Boolean(data?.data?.length);
  const isFilteredEmpty = hasSourceData && filtered.length === 0;
  const isSourceEmpty = data?.data?.length === 0;

  function updateStatus(value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") {
      next.delete("status");
    } else {
      next.set("status", value);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function updateOrdem(value: EventDateSort) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("ordem", value);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  function clearFilters() {
    setInputQ("");
    router.replace(pathname, { scroll: false });
  }

  if (isPending) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground"
        aria-busy
        aria-live="polite"
      >
        <Loader2 className="size-8 animate-spin" aria-hidden />
        <p className="text-sm">Carregando eventos…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle>Não foi possível carregar</CardTitle>
          <CardDescription>
            {error instanceof Error ? error.message : "Erro ao buscar eventos."}
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

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-primary">Filtros</CardTitle>
          <CardDescription>
            Busque por nome, filtre por status e ordene por data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_11rem_minmax(17rem,auto)] lg:items-end lg:gap-x-4">
            <div className="flex min-w-0 flex-col gap-1.5">
              <label
                htmlFor="event-search"
                className="text-muted-foreground text-xs font-medium"
              >
                Buscar por nome
              </label>
              <div className="flex min-w-0 items-center gap-2">
                <div className="relative min-w-0 flex-1">
                  <Search
                    className="text-primary/70 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                    aria-hidden
                  />
                  <Input
                    id="event-search"
                    value={inputQ}
                    onChange={(e) => setInputQ(e.target.value)}
                    placeholder="Nome do evento…"
                    className={filterInputClass}
                    autoComplete="off"
                    aria-describedby="event-search-hint"
                  />
                </div>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="border-primary/40 text-primary hover:bg-primary/10 size-10 shrink-0 lg:hidden"
                        aria-expanded={filtersSheetOpen}
                        aria-controls="events-filters-sheet"
                        aria-label="Abrir filtros por status e ordenação da lista de eventos"
                        onClick={() => setFiltersSheetOpen(true)}
                      >
                        <Filter className="size-4" aria-hidden />
                      </Button>
                    }
                  />
                  <TooltipContent side="bottom" align="end" className="max-w-[16rem]">
                    Abre um painel lateral com filtro por status e ordenação por data. Em telas
                    largas, os filtros ficam ao lado da busca.
                  </TooltipContent>
                </Tooltip>
              </div>
              <p id="event-search-hint" className="sr-only">
                A lista é filtrada conforme você digita.
              </p>
            </div>

            <div className="hidden min-w-0 flex-col gap-1.5 lg:flex">
              <label
                htmlFor="event-status"
                className="text-muted-foreground text-xs font-medium"
              >
                Status
              </label>
              <select
                id="event-status"
                className={filterSelectClass}
                value={statusFilter || "all"}
                onChange={(e) => updateStatus(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="active">Ativo</option>
                <option value="closed">Encerrado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>

            <div className="hidden min-w-0 flex-col gap-1.5 lg:flex">
              <span
                id="event-sort-label"
                className="text-muted-foreground text-xs font-medium"
              >
                Ordenar por data
              </span>
              <div
                className="flex min-h-10 gap-2"
                role="group"
                aria-labelledby="event-sort-label"
              >
                <Button
                  type="button"
                  variant={dateSort === "asc" ? "default" : "outline"}
                  className={cn(
                    "h-10 min-h-10 flex-1 px-3 text-sm sm:flex-initial",
                    dateSort !== "asc" && "border-primary/30 text-primary",
                  )}
                  onClick={() => updateOrdem("asc")}
                  aria-pressed={dateSort === "asc"}
                  aria-label={sortLabels.asc}
                >
                  <ArrowDownAZ className="mr-1.5 size-4 shrink-0" aria-hidden />
                  <span>Mais antiga</span>
                </Button>
                <Button
                  type="button"
                  variant={dateSort === "desc" ? "default" : "outline"}
                  className={cn(
                    "h-10 min-h-10 flex-1 px-3 text-sm sm:flex-initial",
                    dateSort !== "desc" && "border-primary/30 text-primary",
                  )}
                  onClick={() => updateOrdem("desc")}
                  aria-pressed={dateSort === "desc"}
                  aria-label={sortLabels.desc}
                >
                  <ArrowUpAZ className="mr-1.5 size-4 shrink-0" aria-hidden />
                  <span>Mais recente</span>
                </Button>
              </div>
            </div>
          </div>

          <Sheet open={filtersSheetOpen} onOpenChange={setFiltersSheetOpen}>
            <SheetContent
              id="events-filters-sheet"
              side="left"
              className={cn(
                "border-sidebar-border bg-sidebar text-sidebar-foreground gap-0 overflow-y-auto p-0",
                "w-[min(100vw-1rem,20rem)] sm:max-w-sm",
              )}
            >
              <SheetHeader className="border-sidebar-border border-b bg-sidebar-accent/40 px-4 py-4 text-left">
                <SheetTitle
                  id="events-filters-sheet-title"
                  className="text-sidebar-accent-foreground font-heading text-base"
                >
                  Filtros da lista
                </SheetTitle>
                <SheetDescription
                  id="events-filters-sheet-desc"
                  className="text-sidebar-foreground/80"
                >
                  Ajuste o status e a ordenação por data. A busca por nome continua no campo
                  acima do botão de filtros.
                </SheetDescription>
              </SheetHeader>

              <div className="flex flex-col gap-6 p-4">
                <div className="space-y-2">
                  <label
                    htmlFor="event-status-sheet"
                    className="text-sidebar-accent-foreground block text-xs font-medium"
                  >
                    Status do evento
                  </label>
                  <select
                    id="event-status-sheet"
                    className={cn(
                      "border-sidebar-border bg-sidebar-accent/30 text-sidebar-foreground ring-sidebar-ring",
                      "focus-visible:ring-sidebar-ring focus-visible:border-sidebar-primary",
                      "flex h-10 w-full rounded-lg border px-3 py-2 text-sm",
                      "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                    )}
                    value={statusFilter || "all"}
                    onChange={(e) => updateStatus(e.target.value)}
                  >
                    <option value="all">Todos</option>
                    <option value="active">Ativo</option>
                    <option value="closed">Encerrado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>

                <fieldset className="space-y-3 border-0 p-0">
                  <legend className="text-sidebar-accent-foreground mb-1 block text-xs font-medium">
                    Ordenar por data
                  </legend>
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant={dateSort === "asc" ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "justify-start border-sidebar-border",
                        dateSort === "asc"
                          ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                          : "bg-sidebar-accent/20 text-sidebar-accent-foreground hover:bg-sidebar-accent/40",
                      )}
                      onClick={() => updateOrdem("asc")}
                      aria-pressed={dateSort === "asc"}
                      aria-label={sortLabels.asc}
                    >
                      <ArrowDownAZ className="mr-2 size-4 shrink-0" aria-hidden />
                      Mais antiga primeiro
                    </Button>
                    <Button
                      type="button"
                      variant={dateSort === "desc" ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "justify-start border-sidebar-border",
                        dateSort === "desc"
                          ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                          : "bg-sidebar-accent/20 text-sidebar-accent-foreground hover:bg-sidebar-accent/40",
                      )}
                      onClick={() => updateOrdem("desc")}
                      aria-pressed={dateSort === "desc"}
                      aria-label={sortLabels.desc}
                    >
                      <ArrowUpAZ className="mr-2 size-4 shrink-0" aria-hidden />
                      Mais recente primeiro
                    </Button>
                  </div>
                </fieldset>
              </div>
            </SheetContent>
          </Sheet>
        </CardContent>
      </Card>

      {isSourceEmpty && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-primary text-lg">Nenhum evento</CardTitle>
            <CardDescription>
              Não há eventos cadastrados na API no momento.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {isFilteredEmpty && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-primary text-lg">Nenhum resultado</CardTitle>
            <CardDescription>
              Não há eventos que correspondam à busca ou ao filtro selecionado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="secondary" onClick={clearFilters}>
              Limpar filtros
            </Button>
          </CardContent>
        </Card>
      )}

      {!isSourceEmpty && filtered.length > 0 && (
        <>
          <p className="text-muted-foreground rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
            {filtered.length}{" "}
            {filtered.length === 1 ? "evento" : "eventos"}
            {data &&
            data.total > filtered.length &&
            (debouncedQ.trim() || statusFilter)
              ? ` — ${data.total} no total na API`
              : null}
          </p>

          <div className="hidden md:block">
            <div className="overflow-hidden rounded-xl border border-primary/20 shadow-xs">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary/10">
                    <TableHead className="text-primary">Nome</TableHead>
                    <TableHead className="w-[1%] whitespace-nowrap">
                      Data
                    </TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead className="w-[1%]">Status</TableHead>
                    <TableHead className="w-[1%] text-right">
                      Participantes (prev.)
                    </TableHead>
                    <TableHead className="w-[1%]" aria-label="Ação" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((event) => (
                    <TableRow
                      key={event.id}
                      className="group hover:bg-primary/5 data-[state=selected]:bg-primary/10"
                    >
                      <TableCell className="font-medium">
                        <Link
                          href={`/events/${encodeURIComponent(event.id)}`}
                          className="inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline"
                        >
                          {event.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                        {formatDate(event.date)}
                      </TableCell>
                      <TableCell className="max-w-[12rem] truncate text-sm">
                        {event.location}
                      </TableCell>
                      <TableCell>
                        <EventsStatusBadge status={event.status} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatParticipants(event.expected_count)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/events/${encodeURIComponent(event.id)}`}
                          className="text-primary/70 hover:text-primary inline-flex"
                          aria-label={`Ver detalhes de ${event.name}`}
                        >
                          <ChevronRight className="size-4" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <ul className="flex flex-col gap-3 md:hidden">
            {filtered.map((event) => (
              <li key={event.id}>
                <Card className="border-primary/20 bg-primary/5/50 transition-colors hover:bg-primary/10">
                  <CardHeader className="gap-2 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/events/${encodeURIComponent(event.id)}`}
                        className="text-primary min-w-0 flex-1 text-base leading-snug font-semibold underline-offset-4 hover:underline"
                      >
                        {event.name}
                      </Link>
                      <EventsStatusBadge status={event.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="text-muted-foreground space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 shrink-0" aria-hidden />
                      <time dateTime={event.date}>{formatDate(event.date)}</time>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                      <span className="min-w-0">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="size-4 shrink-0" aria-hidden />
                      <span>
                        {formatParticipants(event.expected_count)} participantes
                        esperados
                      </span>
                    </div>
                    <Link
                      href={`/events/${encodeURIComponent(event.id)}`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "mt-2 inline-flex w-full justify-center gap-1 border-primary/40 text-primary hover:bg-primary/10",
                      )}
                    >
                      Ver detalhes
                      <ChevronRight className="size-4" aria-hidden />
                    </Link>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
