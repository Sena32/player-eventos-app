import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { EventDetail } from "@/features/events/schemas/events.schema";

import {
  fetchEventDetail,
  fetchEventsList,
  postEventCheckin,
} from "./events.service";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    statusText: status === 404 ? "Not Found" : status === 400 ? "Bad Request" : "OK",
    headers: { "Content-Type": "application/json" },
  });
}

function minimalEventDetail(id: string): EventDetail {
  return {
    id,
    name: "Evento",
    date: "2026-06-01",
    location: "SP",
    status: "active",
    expected_count: 10,
    checkin_count: 0,
    error_count: 0,
    entry_rate: 0,
    participants: [],
    checkins: [],
  };
}

describe("events.service — comunicação com o BFF (/api)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("fetchEventsList", () => {
    it("retorna lista quando GET /api/events responde 200 com payload válido", async () => {
      const payload = {
        data: [
          {
            id: "EVT-1",
            name: "Summit",
            date: "2026-01-10",
            location: "SP",
            status: "active" as const,
            expected_count: 100,
            checkin_count: 0,
            error_count: 0,
            entry_rate: 0,
          },
        ],
        total: 1,
      };
      vi.mocked(fetch).mockResolvedValue(jsonResponse(payload));

      await expect(fetchEventsList()).resolves.toEqual(payload);
      expect(fetch).toHaveBeenCalledWith("/api/events", { cache: "no-store" });
    });

    it("lança ApiError quando a resposta não é OK", async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ error: "Serviço indisponível" }, 503),
      );

      await expect(fetchEventsList()).rejects.toMatchObject({
        name: "ApiError",
        message: "Serviço indisponível",
        status: 503,
      });
    });

    it("usa mensagem padrão quando o corpo não traz campo error", async () => {
      vi.mocked(fetch).mockResolvedValue(jsonResponse({}, 500));

      await expect(fetchEventsList()).rejects.toMatchObject({
        name: "ApiError",
        message: "Falha ao carregar eventos.",
        status: 500,
      });
    });
  });

  describe("fetchEventDetail", () => {
    it("retorna detalhe quando GET /api/events/[id] responde 200", async () => {
      const detail = minimalEventDetail("EVT-42");
      vi.mocked(fetch).mockResolvedValue(jsonResponse(detail));

      await expect(fetchEventDetail("EVT-42")).resolves.toEqual(detail);
      expect(fetch).toHaveBeenCalledWith("/api/events/EVT-42", { cache: "no-store" });
    });

    it("codifica id na URL", async () => {
      const detail = minimalEventDetail("EVT/with space");
      vi.mocked(fetch).mockResolvedValue(jsonResponse(detail));

      await fetchEventDetail("EVT/with space");
      expect(fetch).toHaveBeenCalledWith("/api/events/EVT%2Fwith%20space", {
        cache: "no-store",
      });
    });

    it("lança ApiError em erro HTTP", async () => {
      vi.mocked(fetch).mockResolvedValue(jsonResponse({ error: "Não encontrado" }, 404));

      await expect(fetchEventDetail("x")).rejects.toMatchObject({
        name: "ApiError",
        message: "Não encontrado",
        status: 404,
      });
    });
  });

  describe("postEventCheckin", () => {
    it("interpreta sucesso 200 com ok/message/event", async () => {
      const event = minimalEventDetail("EVT-1");
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({
          ok: true,
          message: "Check-in ok",
          event,
        }),
      );

      await expect(
        postEventCheckin("EVT-1", { participantId: "P1", action: "entry" }),
      ).resolves.toEqual({
        ok: true,
        message: "Check-in ok",
        event,
      });

      expect(fetch).toHaveBeenCalledWith("/api/events/EVT-1/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: "P1", action: "entry" }),
      });
    });

    it("preenche defaults quando campos opcionais vêm ausentes em 200", async () => {
      vi.mocked(fetch).mockResolvedValue(jsonResponse({}));

      await expect(postEventCheckin("EVT-1", { participantId: "P1", action: "entry" })).resolves.toEqual({
        ok: true,
        message: "Operação concluída.",
        event: undefined,
      });
    });

    it("em 400 com message no JSON retorna ok false sem lançar", async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ ok: false, message: "Participante já dentro." }, 400),
      );

      await expect(
        postEventCheckin("EVT-1", { participantId: "P1", action: "entry" }),
      ).resolves.toEqual({
        ok: false,
        message: "Participante já dentro.",
        event: undefined,
      });
    });

    it("lança ApiError quando JSON não casa com o schema esperado", async () => {
      vi.mocked(fetch).mockResolvedValue(jsonResponse({ ok: "não-booleano" }));

      await expect(
        postEventCheckin("EVT-1", { participantId: "P1", action: "entry" }),
      ).rejects.toMatchObject({
        name: "ApiError",
        message: "Resposta inválida do servidor.",
      });
    });

    it("em erro HTTP sem message usa campo error", async () => {
      vi.mocked(fetch).mockResolvedValue(jsonResponse({ error: "Payload inválido." }, 400));

      await expect(
        postEventCheckin("EVT-1", { participantId: "", action: "entry" }),
      ).rejects.toMatchObject({
        name: "ApiError",
        message: "Payload inválido.",
        status: 400,
      });
    });
  });
});
