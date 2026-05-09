import { z } from "zod";

import {
  checkinSchema,
  eventDetailSchema,
  eventStatusSchema,
  participantSchema,
  type EventDetail,
} from "@/features/events/schemas/events.schema";

import { apiClient } from "@/lib/api/client";

const eventRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  date: z.string(),
  location: z.string(),
  status: eventStatusSchema,
  expected_count: z.number(),
  checkin_count: z.number(),
  error_count: z.number(),
  entry_rate: z.number(),
  description: z.string().optional(),
});

export function isNestedEventDetailPayload(raw: unknown): boolean {
  if (typeof raw !== "object" || raw === null) {
    return false;
  }
  return "participants" in raw && Array.isArray((raw as { participants: unknown }).participants);
}

export async function fetchEventDetailSnapshot(eventId: string): Promise<{
  detail: EventDetail;
  usesJsonServerCollections: boolean;
}> {
  const decodedId = decodeURIComponent(eventId);
  const pathId = encodeURIComponent(decodedId);
  const raw = await apiClient<unknown>(`/events/${pathId}`);

  if (isNestedEventDetailPayload(raw)) {
    return {
      detail: eventDetailSchema.parse(raw),
      usesJsonServerCollections: false,
    };
  }

  const eventRow = eventRowSchema.parse(raw);
  const [participantsRaw, checkinsRaw] = await Promise.all([
    apiClient<unknown>(`/participants?event_id=${encodeURIComponent(decodedId)}`),
    apiClient<unknown>(`/checkins?event_id=${encodeURIComponent(decodedId)}`),
  ]);

  const participants = z.array(participantSchema).parse(participantsRaw);
  const checkins = z.array(checkinSchema).parse(checkinsRaw);

  return {
    detail: eventDetailSchema.parse({
      ...eventRow,
      participants,
      checkins,
    }),
    usesJsonServerCollections: true,
  };
}
