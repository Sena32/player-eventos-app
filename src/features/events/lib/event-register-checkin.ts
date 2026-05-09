import type { EventDetail } from "@/features/events/schemas/events.schema";

export interface RegisterCheckinInput {
  participantId: string;
  action: "entry" | "exit";
  /** ISO timestamp; injetável em testes */
  now?: string;
}

export type RegisterCheckinResult =
  | { ok: true; event: EventDetail; message: string }
  | { ok: false; event: EventDetail; message: string }
  | { ok: false; event?: undefined; message: string };

function nextCheckinId(event: EventDetail): string {
  const marker = "-CK";
  let max = 0;
  for (const checkin of event.checkins) {
    const pos = checkin.id.lastIndexOf(marker);
    if (pos === -1) {
      continue;
    }
    const n = Number.parseInt(checkin.id.slice(pos + marker.length), 10);
    if (!Number.isNaN(n)) {
      max = Math.max(max, n);
    }
  }
  return `${event.id}-CK${String(max + 1).padStart(3, "0")}`;
}

function computeEntryRate(successfulEntries: number, expectedCount: number): number {
  if (expectedCount <= 0) {
    return 0;
  }
  return Math.round((successfulEntries / expectedCount) * 100) / 100;
}

function countSuccessfulEntries(checkins: EventDetail["checkins"]): number {
  return checkins.filter((c) => c.success && c.action === "entry").length;
}

export function registerCheckin(
  event: EventDetail,
  input: RegisterCheckinInput,
): RegisterCheckinResult {
  const timestamp = input.now ?? new Date().toISOString();

  if (event.status === "closed") {
    return {
      ok: false,
      message:
        "Este evento está encerrado (status fechado). Não é possível registrar novas entradas ou saídas.",
    };
  }

  if (event.status === "cancelled") {
    return {
      ok: false,
      message:
        "Este evento foi cancelado. Não é possível registrar check-ins.",
    };
  }

  const participant = event.participants.find((p) => p.id === input.participantId);
  if (!participant) {
    return {
      ok: false,
      message: "Participante não encontrado para este evento.",
    };
  }

  if (input.action === "exit" && participant.type !== "vip") {
    return {
      ok: false,
      message: "Apenas participantes VIP podem registrar saída.",
    };
  }

  if (input.action === "entry" && participant.type === "normal") {
    const alreadyEntered =
      participant.checkin_count > 0 ||
      participant.status === "inside" ||
      event.checkins.some(
        (c) =>
          c.participant_id === participant.id && c.success && c.action === "entry",
      );

    if (alreadyEntered) {
      const newCheckin = {
        id: nextCheckinId(event),
        event_id: event.id,
        participant_id: participant.id,
        timestamp,
        success: false,
        action: "entry" as const,
        error_reason: "already_checked_in" as const,
      };

      const nextCheckins = [newCheckin, ...event.checkins];
      const successfulEntries = countSuccessfulEntries(nextCheckins);

      return {
        ok: false,
        event: {
          ...event,
          checkins: nextCheckins,
          error_count: event.error_count + 1,
          checkin_count: successfulEntries,
          entry_rate: computeEntryRate(successfulEntries, event.expected_count),
        },
        message: "Este participante já realizou check-in.",
      };
    }
  }

  if (input.action === "entry" && participant.status === "inside") {
    return {
      ok: false,
      message: "O participante já está dentro do evento.",
    };
  }

  if (input.action === "exit" && participant.status === "outside") {
    return {
      ok: false,
      message: "O participante já está fora do evento.",
    };
  }

  const newCheckin = {
    id: nextCheckinId(event),
    event_id: event.id,
    participant_id: participant.id,
    timestamp,
    success: true,
    action: input.action,
    error_reason: null,
  };

  const nextCheckins = [newCheckin, ...event.checkins];

  const nextParticipants = event.participants.map((p) =>
    p.id === participant.id
      ? {
          ...p,
          status: input.action === "entry" ? ("inside" as const) : ("outside" as const),
          checkin_count: p.checkin_count + 1,
        }
      : p,
  );

  const successfulEntries = countSuccessfulEntries(nextCheckins);

  const nextEvent: EventDetail = {
    ...event,
    participants: nextParticipants,
    checkins: nextCheckins,
    checkin_count: successfulEntries,
    entry_rate: computeEntryRate(successfulEntries, event.expected_count),
  };

  if (input.action === "entry" && participant.type === "vip") {
    return {
      ok: true,
      event: nextEvent,
      message: 'Entrada registrada, status atualizado para "inside".',
    };
  }

  if (input.action === "entry" && participant.type === "normal") {
    return {
      ok: true,
      event: nextEvent,
      message: "Check-in registrado, sem possibilidade de repetir.",
    };
  }

  return {
    ok: true,
    event: nextEvent,
    message: 'Saída registrada, status atualizado para "outside". Pode entrar novamente.',
  };
}

export function allowsCheckinRegistration(status: EventDetail["status"]): boolean {
  return status === "active";
}
