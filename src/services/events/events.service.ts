import {
  type EventDetail,
  type EventListResponse,
  eventDetailSchema,
  eventListResponseSchema,
} from "@/features/events/schemas/events.schema";
import { ApiError } from "@/lib/api/client";

function getMessageFromErrorBody(json: unknown, fallback: string): string {
  if (
    typeof json === "object" &&
    json !== null &&
    "error" in json &&
    typeof (json as { error: unknown }).error === "string"
  ) {
    return (json as { error: string }).error;
  }
  return fallback;
}

export async function fetchEventsList(): Promise<EventListResponse> {
  const res = await fetch("/api/events", { cache: "no-store" });
  const json: unknown = await res.json();
  if (!res.ok) {
    throw new ApiError(
      getMessageFromErrorBody(json, "Falha ao carregar eventos."),
      res.status,
      json,
    );
  }
  return eventListResponseSchema.parse(json);
}

export async function fetchEventDetail(id: string): Promise<EventDetail> {
  const res = await fetch(`/api/events/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  const json: unknown = await res.json();
  if (!res.ok) {
    throw new ApiError(
      getMessageFromErrorBody(json, "Falha ao carregar o evento."),
      res.status,
      json,
    );
  }
  return eventDetailSchema.parse(json);
}
