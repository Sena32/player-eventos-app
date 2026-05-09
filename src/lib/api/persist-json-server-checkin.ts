import type { EventDetail } from "@/features/events/schemas/events.schema";

import { apiClient } from "@/lib/api/client";

/**
 * Persiste o resultado de um check-in no json-server local:
 * POST /checkins → PATCH /participants/:id → PATCH /events/:id
 * (ordem alinhada à referência da API).
 */
export async function persistCheckinToJsonServer(
  before: EventDetail,
  after: EventDetail,
): Promise<void> {
  const newCheckin = after.checkins[0];
  if (!newCheckin) {
    return;
  }

  const hadCheckinIds = new Set(before.checkins.map((c) => c.id));
  if (!hadCheckinIds.has(newCheckin.id)) {
    await apiClient("/checkins", {
      method: "POST",
      body: JSON.stringify({
        id: newCheckin.id,
        event_id: newCheckin.event_id,
        participant_id: newCheckin.participant_id,
        timestamp: newCheckin.timestamp,
        success: newCheckin.success,
        action: newCheckin.action,
        error_reason: newCheckin.error_reason,
      }),
    });
  }

  for (const nextP of after.participants) {
    const prevP = before.participants.find((p) => p.id === nextP.id);
    if (
      prevP &&
      (prevP.status !== nextP.status || prevP.checkin_count !== nextP.checkin_count)
    ) {
      await apiClient(`/participants/${encodeURIComponent(nextP.id)}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: nextP.status,
          checkin_count: nextP.checkin_count,
        }),
      });
    }
  }

  if (
    before.checkin_count !== after.checkin_count ||
    before.error_count !== after.error_count ||
    before.entry_rate !== after.entry_rate
  ) {
    await apiClient(`/events/${encodeURIComponent(after.id)}`, {
      method: "PATCH",
      body: JSON.stringify({
        checkin_count: after.checkin_count,
        error_count: after.error_count,
        entry_rate: after.entry_rate,
      }),
    });
  }
}
