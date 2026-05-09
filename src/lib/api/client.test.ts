import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiClient } from "./client";

describe("apiClient", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ hello: "world" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    process.env.NEXT_PUBLIC_EXTERNAL_API_URL = "https://api.example.test";
    delete process.env.NEXT_PUBLIC_EXTERNAL_API_KEY;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
  });

  it("monta URL com base da env e envia JSON por padrao", async () => {
    const data = await apiClient<{ hello: string }>("/events");

    expect(data).toEqual({ hello: "world" });
    expect(fetch).toHaveBeenCalledWith(
      "https://api.example.test/events",
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
    const headers = vi.mocked(fetch).mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("normaliza base sem barra final", async () => {
    process.env.NEXT_PUBLIC_EXTERNAL_API_URL = "https://api.example.test/";
    await apiClient("/items");

    expect(fetch).toHaveBeenCalledWith(
      "https://api.example.test/items",
      expect.any(Object),
    );
  });

  it("aceita URL absoluta sem prefixar a base", async () => {
    await apiClient("https://other.test/x");

    expect(fetch).toHaveBeenCalledWith("https://other.test/x", expect.any(Object));
  });

  it("envia Authorization quando NEXT_PUBLIC_EXTERNAL_API_KEY esta definida", async () => {
    process.env.NEXT_PUBLIC_EXTERNAL_API_KEY = "token-secreto";
    await apiClient("/x");

    const headers = vi.mocked(fetch).mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer token-secreto");
  });

  it("skipJsonHeaders evita Content-Type application/json", async () => {
    await apiClient("/upload", { method: "POST", skipJsonHeaders: true });

    const headers = vi.mocked(fetch).mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get("Content-Type")).toBeNull();
  });

  it("resposta nao OK com corpo JSON lança ApiError", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ detail: "bad" }), {
        status: 422,
        statusText: "Unprocessable",
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(apiClient("/x")).rejects.toMatchObject({
      name: "ApiError",
      status: 422,
      body: { detail: "bad" },
    });
  });

  it("resposta 204 retorna undefined", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));

    await expect(apiClient<undefined>("/x")).resolves.toBeUndefined();
  });

  it("resposta OK sem JSON parseavel devolve texto como tipo generico", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("plain", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      }),
    );

    const text = await apiClient<string>("/x");
    expect(text).toBe("plain");
  });
});

describe("ApiError", () => {
  it("preserva status e body", () => {
    const err = new ApiError("msg", 503, { retry: true });
    expect(err.message).toBe("msg");
    expect(err.status).toBe(503);
    expect(err.body).toEqual({ retry: true });
  });
});
