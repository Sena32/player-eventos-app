import { Suspense } from "react";

import { EventsList, EventsListSkeleton } from "@/features/events/components/events-list";

export default function EventsPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Eventos</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Consulte eventos, filtre por status, ordene por data e abra o detalhe.
        </p>
      </div>

      <Suspense fallback={<EventsListSkeleton />}>
        <EventsList />
      </Suspense>
    </div>
  );
}
