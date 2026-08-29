import { Card } from "@basango/ui/components/card";
import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  detail: string;
  icon: LucideIcon;
  label: string;
  suffix?: string;
  tone: "danger" | "healthy" | "neutral" | "warning";
  value: number;
};

export function MetricCard({ detail, icon: Icon, label, suffix, tone, value }: MetricCardProps) {
  const toneClass = {
    danger: "text-destructive",
    healthy: "text-emerald-600 dark:text-emerald-400",
    neutral: "text-foreground",
    warning: "text-amber-600 dark:text-amber-400",
  }[tone];

  return (
    <Card className="flex flex-col gap-2 border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-4xl font-semibold tabular-nums">
        {value.toLocaleString()}
        {suffix}
      </p>
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className={`size-4 ${toneClass}`} />
        <span className="text-muted-foreground">{detail}</span>
      </div>
    </Card>
  );
}
