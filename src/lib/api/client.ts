export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function normalizeBase(url: string): string {
  return url.replace(/\/$/, "");
}

function resolveExternalBase(): string {
  const raw = process.env.NEXT_PUBLIC_EXTERNAL_API_URL;
  if (!raw) {
    return "";
  }
  return normalizeBase(raw);
}

export type ApiClientOptions = RequestInit & {
  /** Quando true, não envia JSON Content-Type (ex.: uploads). */
  skipJsonHeaders?: boolean;
};

/**
 * Cliente HTTP tipado para a API externa.
 * Usa NEXT_PUBLIC_EXTERNAL_API_URL; paths relativos são resolvidos contra essa base.
 */
export async function apiClient<T>(
  path: string,
  options: ApiClientOptions = {},
): Promise<T> {
  const { skipJsonHeaders, headers, ...init } = options;
  const base = resolveExternalBase();
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;

  const mergedHeaders = new Headers(headers);
  if (!skipJsonHeaders && !mergedHeaders.has("Content-Type")) {
    mergedHeaders.set("Content-Type", "application/json");
  }
  const key = process.env.NEXT_PUBLIC_EXTERNAL_API_KEY;
  if (key && !mergedHeaders.has("Authorization")) {
    mergedHeaders.set("Authorization", `Bearer ${key}`);
  }

  const res = await fetch(url, {
    ...init,
    headers: mergedHeaders,
  });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    throw new ApiError(res.statusText || "Request failed", res.status, body);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }

  return (await res.text()) as T;
}
