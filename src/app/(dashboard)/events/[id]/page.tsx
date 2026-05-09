import { EventDetailView } from "@/features/events/components/event-detail-view";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <EventDetailView eventId={id} />
    </div>
  );
}
