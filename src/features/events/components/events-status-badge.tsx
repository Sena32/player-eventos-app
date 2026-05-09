import type { EventStatus } from "@/features/events/schemas/events.schema";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const labels: Record<EventStatus, string> = {
  active: "Ativo",
  closed: "Encerrado",
  cancelled: "Cancelado",
};

const variants: Record<
  EventStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  closed: "secondary",
  cancelled: "destructive",
};

export function EventsStatusBadge({
  status,
  className,
}: {
  status: EventStatus;
  className?: string;
}) {
  return (
    <Badge variant={variants[status]} className={cn("shrink-0", className)}>
      {labels[status]}
    </Badge>
  );
}
