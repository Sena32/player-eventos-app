import { describe, expect, it } from "vitest"

import {
  buildCheckinsByHour,
  buildOutcomeData,
  formatEntryRate,
} from "@/features/events/lib/event-detail-metrics"

describe("event-detail-metrics", () => {
  it("normaliza taxa de entrada decimal para porcentagem", () => {
    expect(formatEntryRate(0.456)).toBe("45.6%")
  })

  it("agrupa check-ins por hora com ordenacao crescente", () => {
    const checkins = [
      {
        id: "1",
        event_id: "e1",
        participant_id: "p1",
        timestamp: "2026-05-09T10:15:00",
        success: true,
        action: "entry" as const,
        error_reason: null,
      },
      {
        id: "2",
        event_id: "e1",
        participant_id: "p2",
        timestamp: "2026-05-09T10:35:00",
        success: false,
        action: "entry" as const,
        error_reason: "already_checked_in" as const,
      },
      {
        id: "3",
        event_id: "e1",
        participant_id: "p3",
        timestamp: "2026-05-09T11:05:00",
        success: true,
        action: "entry" as const,
        error_reason: null,
      },
    ]

    expect(buildCheckinsByHour(checkins)).toEqual([
      { hour: "10:00", total: 2 },
      { hour: "11:00", total: 1 },
    ])
  })

  it("monta proporcao de sucesso e erro", () => {
    const checkins = [
      {
        id: "1",
        event_id: "e1",
        participant_id: "p1",
        timestamp: "2026-05-09T10:15:00.000Z",
        success: true,
        action: "entry" as const,
        error_reason: null,
      },
      {
        id: "2",
        event_id: "e1",
        participant_id: "p2",
        timestamp: "2026-05-09T10:35:00.000Z",
        success: false,
        action: "entry" as const,
        error_reason: "already_checked_in" as const,
      },
    ]

    expect(buildOutcomeData(checkins)).toEqual([
      { name: "Sucesso", value: 1 },
      { name: "Erro", value: 1 },
    ])
  })
})

