import { describe, expect, it } from "vitest";

import {
  calculateOccupancy,
  cn,
  formatCurrency,
  formatDate,
  slugify,
} from "@/lib/utils";

describe("cn", () => {
  it("mescla classes Tailwind sem conflito", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });
});

describe("formatCurrency", () => {
  it("formata em BRL", () => {
    expect(formatCurrency(12.5)).toMatch(/12,50/);
  });
});

describe("formatDate", () => {
  it("formata em pt-BR (data local)", () => {
    expect(formatDate(new Date(2026, 4, 8))).toBe("08/05/2026");
  });
});

describe("calculateOccupancy", () => {
  it("retorna percentual limitado a 100", () => {
    expect(calculateOccupancy(50, 100)).toBe(50);
    expect(calculateOccupancy(200, 100)).toBe(100);
    expect(calculateOccupancy(10, 0)).toBe(0);
  });
});

describe("slugify", () => {
  it("normaliza texto", () => {
    expect(slugify("  Olá Mundo!  ")).toBe("ola-mundo");
  });
});
