import type { EventListItem, EventStatus } from "@/features/events/schemas/events.schema";

export type EventDateSort = "asc" | "desc";

export type FilterSortEventsParams = {
  /** Texto da busca (nome), sem acento case-insensitive pode ser tratado no caller */
  q: string;
  /** Status filtrado; `null` ou string vazia = todos */
  status: EventStatus | "" | null;
  /** Ordenação da data do evento */
  dateSort: EventDateSort;
};

function normalizeSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

function eventDateValue(isoDate: string): number {
  const t = Date.parse(isoDate);
  return Number.isNaN(t) ? 0 : t;
}

/**
 * Filtra por nome e status e ordena por data (campo `date` ISO).
 */
export function filterAndSortEvents(
  events: EventListItem[],
  params: FilterSortEventsParams,
): EventListItem[] {
  const qNorm = normalizeSearch(params.q);
  const statusFilter = params.status;

  let list = events.filter((e) => {
    if (statusFilter && e.status !== statusFilter) {
      return false;
    }
    if (!qNorm) {
      return true;
    }
    return normalizeSearch(e.name).includes(qNorm);
  });

  list = [...list].sort((a, b) => {
    const da = eventDateValue(a.date);
    const db = eventDateValue(b.date);
    return params.dateSort === "asc" ? da - db : db - da;
  });

  return list;
}
