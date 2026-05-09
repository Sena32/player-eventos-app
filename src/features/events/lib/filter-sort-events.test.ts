import { describe, expect, it } from "vitest";

import { filterAndSortEvents } from "@/features/events/lib/filter-sort-events";
import type { EventListItem } from "@/features/events/schemas/events.schema";

const base = (over: Partial<EventListItem>): EventListItem => ({
  id: "EVT-1",
  name: "Show Teste",
  date: "2026-06-01",
  location: "SP",
  status: "active",
  expected_count: 100,
  checkin_count: 0,
  error_count: 0,
  entry_rate: 0,
  ...over,
});

describe("filterAndSortEvents", () => {
  const items: EventListItem[] = [
    base({ id: "a", name: "Festival Alpha", date: "2026-03-01", status: "active" }),
    base({
      id: "b",
      name: "Workshop Beta",
      date: "2026-01-15",
      status: "closed",
    }),
    base({
      id: "c",
      name: "Show Gamma",
      date: "2026-12-31",
      status: "cancelled",
    }),
  ];

  it("filtra por nome (sem acentos, case-insensitive)", () => {
    const r = filterAndSortEvents(items, {
      q: "work",
      status: "",
      dateSort: "asc",
    });
    expect(r.map((e) => e.id)).toEqual(["b"]);
  });

  it("filtra por status", () => {
    const r = filterAndSortEvents(items, {
      q: "",
      status: "closed",
      dateSort: "asc",
    });
    expect(r.map((e) => e.id)).toEqual(["b"]);
  });

  it("ordena por data ascendente", () => {
    const r = filterAndSortEvents(items, {
      q: "",
      status: "",
      dateSort: "asc",
    });
    expect(r.map((e) => e.id)).toEqual(["b", "a", "c"]);
  });

  it("ordena por data descendente", () => {
    const r = filterAndSortEvents(items, {
      q: "",
      status: "",
      dateSort: "desc",
    });
    expect(r.map((e) => e.id)).toEqual(["c", "a", "b"]);
  });
});
