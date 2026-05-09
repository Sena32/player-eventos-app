import { NextResponse } from "next/server";

import { eventDetailSchema } from "@/features/events/schemas/events.schema";
import { ApiError, apiClient } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/api/error-handler";

type RouteContext = { params: Promise<{ id: string }> };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function fetchRawEventDetail(id: string): Promise<unknown> {
  try {
    return await apiClient<unknown>(`/events/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return apiClient<unknown>(`/api/events/${id}.json`);
    }
    throw error;
  }
}

export async function GET(_request: Request, context: RouteContext) {
  if (!process.env.EXTERNAL_API_URL?.trim()) {
    return NextResponse.json(
      {
        error:
          "EXTERNAL_API_URL não está configurada. Defina em .env.local para carregar eventos.",
      },
      { status: 503 },
    );
  }

  const { id } = await context.params;
  const safeId = encodeURIComponent(id);

  try {
    const raw = await fetchRawEventDetail(safeId);
    const parsed = eventDetailSchema.parse(raw);
    return NextResponse.json(parsed);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    if (status === 404) {
      return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });
    }
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
