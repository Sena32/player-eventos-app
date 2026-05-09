import { describe, expect, it } from "vitest";

import type { EventDetail } from "@/features/events/schemas/events.schema";

import { allowsCheckinRegistration, registerCheckin } from "./event-register-checkin";

const baseEvent = (): EventDetail => ({
  id: "EVT-TEST",
  name: "Evento teste",
  date: "2026-01-01T10:00:00.000Z",
  location: "Local",
  status: "active",
  description: "Desc",
  expected_count: 10,
  checkin_count: 0,
  error_count: 0,
  entry_rate: 0,
  participants: [
    {
      id: "EVT-TEST-P1",
      event_id: "EVT-TEST",
      name: "VIP Um",
      type: "vip",
      status: "outside",
      checkin_count: 0,
    },
    {
      id: "EVT-TEST-P2",
      event_id: "EVT-TEST",
      name: "Normal Um",
      type: "normal",
      status: "outside",
      checkin_count: 0,
    },
  ],
  checkins: [],
});

describe("registerCheckin", () => {
  it("VIP: entrada registra historico e status inside", () => {
    const event = baseEvent();
    const result = registerCheckin(event, {
      participantId: "EVT-TEST-P1",
      action: "entry",
      now: "2026-01-01T12:00:00.000Z",
    });

    expect(result.ok).toBe(true);
    if (!result.ok || !("event" in result)) {
      throw new Error("esperado sucesso");
    }
    expect(result.message).toContain("inside");
    expect(result.event.checkins).toHaveLength(1);
    expect(result.event.checkins[0]?.action).toBe("entry");
    expect(result.event.checkins[0]?.success).toBe(true);
    const vip = result.event.participants.find((p) => p.id === "EVT-TEST-P1");
    expect(vip?.status).toBe("inside");
    expect(vip?.checkin_count).toBe(1);
  });

  it("VIP: saida registra historico e status outside", () => {
    const event = baseEvent();
    event.participants[0] = {
      ...event.participants[0]!,
      status: "inside",
      checkin_count: 1,
    };
    const result = registerCheckin(event, {
      participantId: "EVT-TEST-P1",
      action: "exit",
      now: "2026-01-01T12:00:00.000Z",
    });

    expect(result.ok).toBe(true);
    if (!result.ok || !("event" in result)) {
      throw new Error("esperado sucesso");
    }
    expect(result.message).toContain("outside");
    expect(result.event.checkins[0]?.action).toBe("exit");
    const vip = result.event.participants.find((p) => p.id === "EVT-TEST-P1");
    expect(vip?.status).toBe("outside");
    expect(vip?.checkin_count).toBe(2);
  });

  it("Normal: primeira entrada com sucesso", () => {
    const event = baseEvent();
    const result = registerCheckin(event, {
      participantId: "EVT-TEST-P2",
      action: "entry",
      now: "2026-01-01T12:00:00.000Z",
    });

    expect(result.ok).toBe(true);
    if (!result.ok || !("event" in result)) {
      throw new Error("esperado sucesso");
    }
    expect(result.message).toContain("sem possibilidade de repetir");
    const p = result.event.participants.find((x) => x.id === "EVT-TEST-P2");
    expect(p?.status).toBe("inside");
    expect(p?.checkin_count).toBe(1);
  });

  it("Normal: segunda entrada gera erro e registro falho no historico", () => {
    const event = baseEvent();
    event.participants[1] = {
      ...event.participants[1]!,
      status: "inside",
      checkin_count: 1,
    };
    event.checkins = [
      {
        id: "EVT-TEST-CK001",
        event_id: "EVT-TEST",
        participant_id: "EVT-TEST-P2",
        timestamp: "2026-01-01T11:00:00.000Z",
        success: true,
        action: "entry",
        error_reason: null,
      },
    ];
    event.checkin_count = 1;
    event.error_count = 0;
    event.entry_rate = 0.1;

    const result = registerCheckin(event, {
      participantId: "EVT-TEST-P2",
      action: "entry",
      now: "2026-01-01T12:00:00.000Z",
    });

    expect(result.ok).toBe(false);
    if (result.ok || !result.event) {
      throw new Error("esperado falha com evento atualizado");
    }
    expect(result.message).toContain("já realizou check-in");
    expect(result.event.checkins[0]?.success).toBe(false);
    expect(result.event.checkins[0]?.error_reason).toBe("already_checked_in");
    expect(result.event.error_count).toBe(1);
  });

  it("Evento fechado: bloqueia sem atualizar estado", () => {
    const event = baseEvent();
    event.status = "closed";
    const result = registerCheckin(event, {
      participantId: "EVT-TEST-P1",
      action: "entry",
    });

    expect(result.ok).toBe(false);
    expect(result.event).toBeUndefined();
    expect(result.message).toContain("encerrado");
  });

  it("Normal nao pode registrar saida", () => {
    const event = baseEvent();
    event.participants[1] = {
      ...event.participants[1]!,
      status: "inside",
      checkin_count: 1,
    };
    const result = registerCheckin(event, {
      participantId: "EVT-TEST-P2",
      action: "exit",
    });

    expect(result.ok).toBe(false);
    expect(result.event).toBeUndefined();
    expect(result.message).toContain("VIP");
  });

  it("Evento cancelado: bloqueia sem atualizar estado", () => {
    const event = baseEvent();
    event.status = "cancelled";
    const result = registerCheckin(event, {
      participantId: "EVT-TEST-P1",
      action: "entry",
    });

    expect(result.ok).toBe(false);
    expect(result.event).toBeUndefined();
    expect(result.message).toContain("cancelado");
  });

  it("Participante inexistente: bloqueia sem atualizar estado", () => {
    const event = baseEvent();
    const result = registerCheckin(event, {
      participantId: "EVT-TEST-DESCONHECIDO",
      action: "entry",
    });

    expect(result.ok).toBe(false);
    expect(result.event).toBeUndefined();
    expect(result.message).toContain("não encontrado");
  });

  it("VIP: segunda entrada quando ja esta inside bloqueia sem atualizar estado", () => {
    const event = baseEvent();
    event.participants[0] = {
      ...event.participants[0]!,
      status: "inside",
      checkin_count: 1,
    };
    const result = registerCheckin(event, {
      participantId: "EVT-TEST-P1",
      action: "entry",
    });

    expect(result.ok).toBe(false);
    expect(result.event).toBeUndefined();
    expect(result.message).toContain("já está dentro");
  });

  it("VIP: segunda saida quando ja esta outside bloqueia sem atualizar estado", () => {
    const event = baseEvent();
    const result = registerCheckin(event, {
      participantId: "EVT-TEST-P1",
      action: "exit",
    });

    expect(result.ok).toBe(false);
    expect(result.event).toBeUndefined();
    expect(result.message).toContain("já está fora");
  });

  it("Normal: bloqueia entrada duplicada quando status inside mesmo com checkin_count zero", () => {
    const event = baseEvent();
    event.participants[1] = {
      ...event.participants[1]!,
      status: "inside",
      checkin_count: 0,
    };

    const result = registerCheckin(event, {
      participantId: "EVT-TEST-P2",
      action: "entry",
      now: "2026-01-01T13:00:00.000Z",
    });

    expect(result.ok).toBe(false);
    if (result.ok || !result.event) {
      throw new Error("esperado falha com evento atualizado");
    }
    expect(result.message).toContain("já realizou check-in");
    expect(result.event.checkins[0]?.error_reason).toBe("already_checked_in");
    expect(result.event.error_count).toBe(1);
  });

  it("Normal: detecta entrada previa apenas pelo historico de checkins bem-sucedidos", () => {
    const event = baseEvent();
    event.participants[1] = {
      ...event.participants[1]!,
      status: "outside",
      checkin_count: 0,
    };
    event.checkins = [
      {
        id: "EVT-TEST-CK001",
        event_id: "EVT-TEST",
        participant_id: "EVT-TEST-P2",
        timestamp: "2026-01-01T11:00:00.000Z",
        success: true,
        action: "entry",
        error_reason: null,
      },
    ];

    const result = registerCheckin(event, {
      participantId: "EVT-TEST-P2",
      action: "entry",
      now: "2026-01-01T13:00:00.000Z",
    });

    expect(result.ok).toBe(false);
    if (result.ok || !result.event) {
      throw new Error("esperado falha com evento atualizado");
    }
    expect(result.event.checkins[0]?.success).toBe(false);
  });

  it("incrementa id sequencial de checkin (-CK###) com base no historico", () => {
    const event = baseEvent();
    event.checkins = [
      {
        id: "EVT-TEST-CK005",
        event_id: "EVT-TEST",
        participant_id: "EVT-TEST-P2",
        timestamp: "2026-01-01T10:00:00.000Z",
        success: true,
        action: "entry",
        error_reason: null,
      },
    ];

    const result = registerCheckin(event, {
      participantId: "EVT-TEST-P1",
      action: "entry",
      now: "2026-01-01T12:00:00.000Z",
    });

    expect(result.ok).toBe(true);
    if (!result.ok || !result.event) {
      throw new Error("esperado sucesso");
    }
    expect(result.event.checkins[0]?.id).toBe("EVT-TEST-CK006");
  });

  it("atualiza entry_rate apos entrada bem-sucedida", () => {
    const event = baseEvent();
    event.expected_count = 50;
    event.checkins = Array.from({ length: 10 }, (_, i) => ({
      id: `EVT-TEST-CK${String(i).padStart(3, "0")}`,
      event_id: "EVT-TEST",
      participant_id: "EVT-TEST-P1",
      timestamp: "2026-01-01T10:00:00.000Z",
      success: true,
      action: "entry" as const,
      error_reason: null,
    }));
    event.checkin_count = 10;
    event.entry_rate = 0.2;

    const result = registerCheckin(event, {
      participantId: "EVT-TEST-P2",
      action: "entry",
      now: "2026-01-01T12:00:00.000Z",
    });

    expect(result.ok).toBe(true);
    if (!result.ok || !result.event) {
      throw new Error("esperado sucesso");
    }
    expect(result.event.checkin_count).toBe(11);
    expect(result.event.entry_rate).toBe(0.22);
  });

  it("VIP: pode registrar nova entrada apos saida", () => {
    const event = baseEvent();
    event.participants[0] = {
      ...event.participants[0]!,
      status: "inside",
      checkin_count: 1,
    };

    const exit = registerCheckin(event, {
      participantId: "EVT-TEST-P1",
      action: "exit",
      now: "2026-01-01T11:00:00.000Z",
    });
    expect(exit.ok).toBe(true);
    if (!exit.ok || !exit.event) {
      throw new Error("esperado saida ok");
    }

    const reentry = registerCheckin(exit.event, {
      participantId: "EVT-TEST-P1",
      action: "entry",
      now: "2026-01-01T12:00:00.000Z",
    });

    expect(reentry.ok).toBe(true);
    if (!reentry.ok || !reentry.event) {
      throw new Error("esperado reentrada ok");
    }
    expect(reentry.event.participants.find((p) => p.id === "EVT-TEST-P1")?.status).toBe(
      "inside",
    );
    expect(reentry.event.checkins).toHaveLength(2);
  });
});

describe("allowsCheckinRegistration", () => {
  it("permite apenas status active", () => {
    expect(allowsCheckinRegistration("active")).toBe(true);
    expect(allowsCheckinRegistration("closed")).toBe(false);
    expect(allowsCheckinRegistration("cancelled")).toBe(false);
  });
});
