"use client";

import { useQuery } from "@tanstack/react-query";

import { eventsKeys } from "@/features/events/queries/events-query-keys";
import { fetchEventsList } from "@/services/events/events.service";

export function useEventsListQuery() {
  return useQuery({
    queryKey: eventsKeys.lists(),
    queryFn: () => fetchEventsList(),
    staleTime: 60 * 1000,
  });
}
