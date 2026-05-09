"use client";

import { useQuery } from "@tanstack/react-query";

import { eventsKeys } from "@/features/events/queries/events-query-keys";
import { fetchEventDetail } from "@/services/events/events.service";
import { ApiError } from "@/lib/api/client";

export function useEventDetailQuery(id: string) {
  return useQuery({
    queryKey: eventsKeys.detail(id),
    queryFn: () => fetchEventDetail(id),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) {
        return false;
      }
      return failureCount < 2;
    },
  });
}
