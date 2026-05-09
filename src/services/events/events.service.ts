import { z } from "zod";

import {
  type EventDetail,
  type EventListResponse,
  eventDetailSchema,
  eventListResponseSchema,
} from "@/features/events/schemas/events.schema";
import type { CheckinSimulationInput } from "@/features/events/schemas/checkin-simulation.schema";
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

const postCheckinResponseSchema = z.object({
  ok: z.boolean().optional(),
  message: z.string().optional(),
  event: eventDetailSchema.optional(),
  error: z.string().optional(),
});

export async function postEventCheckin(
  eventId: string,
  body: CheckinSimulationInput,
): Promise<{ ok: boolean; message: string; event?: EventDetail }> {
  const res = await fetch(`/api/events/${encodeURIComponent(eventId)}/checkin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json: unknown = await res.json();
  const parsed = postCheckinResponseSchema.safeParse(json);

  if (!parsed.success) {
    throw new ApiError("Resposta inválida do servidor.", res.status, json);
  }

  const payload = parsed.data;

  if (res.ok) {
    return {
      ok: payload.ok ?? true,
      message: payload.message ?? "Operação concluída.",
      event: payload.event,
    };
  }

  if (payload.message) {
    return {
      ok: false,
      message: payload.message,
      event: payload.event,
    };
  }

  throw new ApiError(
    getMessageFromErrorBody(json, "Falha ao registrar check-in."),
    res.status,
    json,
  );
}
