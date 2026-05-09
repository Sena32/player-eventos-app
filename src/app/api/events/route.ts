import { NextResponse } from "next/server";
import { z } from "zod";

import {
  eventListItemSchema,
  eventListResponseSchema,
} from "@/features/events/schemas/events.schema";
import { ApiError, apiClient } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/api/error-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rawEventsListSchema = z.union([
  eventListResponseSchema,
  z.array(eventListItemSchema),
]);

async function fetchRawEventsList(): Promise<unknown> {
  try {
    return await apiClient<unknown>("/events");
  } catch (error) {
    console.log("error", error);
    throw error;
  }
}

export async function GET() {
  if (!process.env.NEXT_PUBLIC_EXTERNAL_API_URL?.trim()) {
    return NextResponse.json(
      {
        error:
          "Erro ao tentar processar requisição URL inválida",
      },
      { status: 503 },
    );
  }

  try {
    const raw = await fetchRawEventsList();
    const parsed = rawEventsListSchema.parse(raw);

    const normalized = Array.isArray(parsed)
      ? { data: parsed, total: parsed.length }
      : parsed;

    return NextResponse.json(normalized);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
