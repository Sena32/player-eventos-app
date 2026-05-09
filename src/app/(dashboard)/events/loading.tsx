import { EventsListSkeleton } from "@/features/events/components/events-list";
import { Skeleton } from "@/components/ui/skeleton";

export default function EventsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div>
        <Skeleton className="h-8 w-48 max-w-full" />
        <Skeleton className="mt-2 h-4 w-full max-w-lg" />
      </div>
      <EventsListSkeleton />
    </div>
  );
}
