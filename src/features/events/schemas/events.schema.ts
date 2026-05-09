import { z } from "zod";

export const eventStatusSchema = z.enum(["active", "closed", "cancelled"]);

export const eventListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  date: z.string(),
  location: z.string(),
  status: eventStatusSchema,
  expected_count: z.number(),
  checkin_count: z.number(),
  error_count: z.number(),
  entry_rate: z.number(),
});

export const eventListResponseSchema = z.object({
  data: z.array(eventListItemSchema),
  total: z.number(),
});

export const participantSchema = z.object({
  id: z.string(),
  event_id: z.string(),
  name: z.string(),
  type: z.enum(["vip", "normal"]),
  status: z.enum(["inside", "outside"]),
  checkin_count: z.number(),
});

export const checkinSchema = z.object({
  id: z.string(),
  event_id: z.string(),
  participant_id: z.string(),
  timestamp: z.string(),
  success: z.boolean(),
  action: z.enum(["entry", "exit"]),
  error_reason: z
    .union([
      z.literal(null),
      z.literal("already_checked_in"),
      z.literal("event_closed"),
    ])
    .nullable(),
});

export const eventDetailSchema = eventListItemSchema.extend({
  description: z.string().optional(),
  participants: z.array(participantSchema).default([]),
  checkins: z.array(checkinSchema).default([]),
});

export type EventStatus = z.infer<typeof eventStatusSchema>;
export type EventListItem = z.infer<typeof eventListItemSchema>;
export type EventListResponse = z.infer<typeof eventListResponseSchema>;
export type EventDetail = z.infer<typeof eventDetailSchema>;
