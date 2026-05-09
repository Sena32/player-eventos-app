import { Skeleton } from "@/components/ui/skeleton";

export default function EventDetailLoading() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-56 w-full rounded-xl" />
    </div>
  );
}
