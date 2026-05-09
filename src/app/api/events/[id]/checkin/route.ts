import { NextResponse } from "next/server";
import { z } from "zod";

import { registerCheckin } from "@/features/events/lib/event-register-checkin";
import { fetchEventDetailSnapshot } from "@/lib/api/fetch-event-detail-snapshot";
import { getErrorMessage } from "@/lib/api/error-handler";
import { persistCheckinToJsonServer } from "@/lib/api/persist-json-server-checkin";
import { ApiError } from "@/lib/api/client";

type RouteContext = { params: Promise<{ id: string }> };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  participantId: z.string().min(1),
  action: z.enum(["entry", "exit"]),
});

export async function POST(request: Request, context: RouteContext) {
  if (!process.env.NEXT_PUBLIC_EXTERNAL_API_URL?.trim()) {
    return NextResponse.json(
      { error: "URL da API externa não configurada." },
      { status: 503 },
    );
  }

  const { id } = await context.params;

  let parsedBody: z.infer<typeof bodySchema>;
  try {
    parsedBody = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  let snapshot: Awaited<ReturnType<typeof fetchEventDetailSnapshot>>;
  try {
    snapshot = await fetchEventDetailSnapshot(id);
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

  const outcome = registerCheckin(snapshot.detail, {
    participantId: parsedBody.participantId,
    action: parsedBody.action,
  });

  if (!("event" in outcome) || !outcome.event) {
    return NextResponse.json(
      { ok: false as const, message: outcome.message },
      { status: 400 },
    );
  }

  if (snapshot.usesJsonServerCollections) {
    try {
      await persistCheckinToJsonServer(snapshot.detail, outcome.event);
    } catch (error) {
      return NextResponse.json(
        {
          error: getErrorMessage(error),
        },
        { status: 502 },
      );
    }

    try {
      const refreshed = await fetchEventDetailSnapshot(id);
      return NextResponse.json({
        ok: outcome.ok,
        message: outcome.message,
        event: refreshed.detail,
      });
    } catch (error) {
      return NextResponse.json(
        { error: getErrorMessage(error) },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    ok: outcome.ok,
    message: outcome.message,
    event: outcome.event,
  });
}
