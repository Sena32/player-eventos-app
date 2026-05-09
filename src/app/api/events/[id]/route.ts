import { NextResponse } from "next/server";

import { fetchEventDetailSnapshot } from "@/lib/api/fetch-event-detail-snapshot";
import { ApiError } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/api/error-handler";

type RouteContext = { params: Promise<{ id: string }> };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: RouteContext) {
  if (!process.env.NEXT_PUBLIC_EXTERNAL_API_URL?.trim()) {
    return NextResponse.json(
      {
        error:
          "Erro ao tentar processar requisição URL inválida",
      },
      { status: 503 },
    );
  }

  const { id } = await context.params;
  const safeId = encodeURIComponent(id);

  try {
    const { detail } = await fetchEventDetailSnapshot(safeId);
    return NextResponse.json(detail);
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
