import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EventsList } from "@/features/events/components/events-list";
import type { EventListResponse } from "@/features/events/schemas/events.schema";

const replaceMock = vi.fn();
const refetchMock = vi.fn();
const useEventsListQueryMock = vi.fn();
let searchParamsMock = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
  usePathname: () => "/events",
  useSearchParams: () => searchParamsMock,
}));

vi.mock("@/hooks/use-debounce", () => ({
  useDebounce: (value: string) => value,
}));

vi.mock("@/features/events/queries/use-events-list-query", () => ({
  useEventsListQuery: () => useEventsListQueryMock(),
}));

function makeResponse(items: EventListResponse["data"]): EventListResponse {
  return {
    data: items,
    total: items.length,
  };
}

describe("EventsList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsMock = new URLSearchParams();
    refetchMock.mockResolvedValue(undefined);
  });

  describe("quando os dados são válidos", () => {
    it("deve renderizar os eventos e links de detalhe", () => {
      useEventsListQueryMock.mockReturnValue({
        data: makeResponse([
          {
            id: "EVT-001",
            name: "Summit React",
            date: "2026-06-10",
            location: "São Paulo",
            status: "active",
            expected_count: 420,
            checkin_count: 0,
            error_count: 0,
            entry_rate: 0,
          },
        ]),
        isPending: false,
        isError: false,
        error: null,
        refetch: refetchMock,
        isRefetching: false,
      });

      render(<EventsList />);

      expect(screen.getAllByText("Summit React").length).toBeGreaterThan(0);
      expect(screen.getAllByText("420").length).toBeGreaterThan(0);
      expect(
        screen.getByRole("link", { name: /ver detalhes de summit react/i }),
      ).toHaveAttribute("href", "/events/EVT-001");
    });

    it("deve atualizar query string ao filtrar status e ordenar", () => {
      useEventsListQueryMock.mockReturnValue({
        data: makeResponse([
          {
            id: "EVT-001",
            name: "Evento A",
            date: "2026-01-10",
            location: "Recife",
            status: "active",
            expected_count: 100,
            checkin_count: 0,
            error_count: 0,
            entry_rate: 0,
          },
        ]),
        isPending: false,
        isError: false,
        error: null,
        refetch: refetchMock,
        isRefetching: false,
      });

      render(<EventsList />);

      fireEvent.change(screen.getByLabelText("Status"), {
        target: { value: "closed" },
      });
      expect(replaceMock).toHaveBeenCalledWith("/events?status=closed", {
        scroll: false,
      });

      fireEvent.click(
        screen.getByRole("button", {
          name: "Data: mais recente primeiro",
        }),
      );
      expect(replaceMock).toHaveBeenCalledWith("/events?ordem=desc", {
        scroll: false,
      });
    });
  });

  describe("quando ocorre exceção ou ausência de dados", () => {
    it("deve renderizar loading enquanto carrega", () => {
      useEventsListQueryMock.mockReturnValue({
        data: undefined,
        isPending: true,
        isError: false,
        error: null,
        refetch: refetchMock,
        isRefetching: false,
      });

      render(<EventsList />);

      expect(screen.getByText("Carregando eventos…")).toBeInTheDocument();
    });

    it("deve renderizar estado vazio quando API retorna lista vazia", () => {
      useEventsListQueryMock.mockReturnValue({
        data: makeResponse([]),
        isPending: false,
        isError: false,
        error: null,
        refetch: refetchMock,
        isRefetching: false,
      });

      render(<EventsList />);

      expect(screen.getByText("Nenhum evento")).toBeInTheDocument();
    });

    it("deve renderizar erro e permitir tentar novamente", () => {
      useEventsListQueryMock.mockReturnValue({
        data: undefined,
        isPending: false,
        isError: true,
        error: new Error("Falha ao buscar"),
        refetch: refetchMock,
        isRefetching: false,
      });

      render(<EventsList />);

      expect(screen.getByText("Não foi possível carregar")).toBeInTheDocument();
      expect(screen.getByText("Falha ao buscar")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
      expect(refetchMock).toHaveBeenCalledTimes(1);
    });

    it("deve renderizar vazio de filtro e limpar filtros", () => {
      searchParamsMock = new URLSearchParams("q=inexistente&status=closed");
      useEventsListQueryMock.mockReturnValue({
        data: makeResponse([
          {
            id: "EVT-100",
            name: "Evento Aberto",
            date: "2026-07-10",
            location: "Fortaleza",
            status: "active",
            expected_count: 80,
            checkin_count: 0,
            error_count: 0,
            entry_rate: 0,
          },
        ]),
        isPending: false,
        isError: false,
        error: null,
        refetch: refetchMock,
        isRefetching: false,
      });

      render(<EventsList />);

      expect(screen.getByText("Nenhum resultado")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));

      expect(replaceMock).toHaveBeenCalledWith("/events", { scroll: false });
    });
  });
});
