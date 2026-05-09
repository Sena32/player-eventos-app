import { TrendingDown, TrendingUp } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: string
  helperText?: string
  trend?: "up" | "down" | "neutral"
  className?: string
}

export function MetricCard({
  title,
  value,
  helperText,
  trend = "neutral",
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("border-primary/20", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {helperText ? (
          <p className="text-muted-foreground inline-flex items-center gap-1 text-xs">
            {trend === "up" ? <TrendingUp className="size-3" aria-hidden /> : null}
            {trend === "down" ? (
              <TrendingDown className="size-3" aria-hidden />
            ) : null}
            {helperText}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
