import type { EventDetail } from "@/features/events/schemas/events.schema"

interface CheckinByHour {
  hour: string
  total: number
}

interface CheckinOutcomeItem {
  name: "Sucesso" | "Erro"
  value: number
}

export function formatMetricNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value)
}

export function formatEntryRate(entryRate: number): string {
  const normalized = entryRate <= 1 ? entryRate * 100 : entryRate
  const clamped = Math.min(Math.max(normalized, 0), 100)
  return `${clamped.toFixed(1)}%`
}

export function buildCheckinsByHour(
  checkins: EventDetail["checkins"]
): CheckinByHour[] {
  const grouped = new Map<string, number>()

  checkins.forEach((checkin) => {
    const date = new Date(checkin.timestamp)
    if (Number.isNaN(date.getTime())) {
      return
    }

    const hour = `${String(date.getHours()).padStart(2, "0")}:00`
    grouped.set(hour, (grouped.get(hour) ?? 0) + 1)
  })

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hour, total]) => ({ hour, total }))
}

export function buildOutcomeData(
  checkins: EventDetail["checkins"]
): CheckinOutcomeItem[] {
  const success = checkins.filter((checkin) => checkin.success).length
  const error = checkins.length - success

  return [
    { name: "Sucesso", value: success },
    { name: "Erro", value: error },
  ]
}

