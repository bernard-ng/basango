import { formatDistanceToNowStrict } from "date-fns";

export function relativeTime(date: Date) {
  return formatDistanceToNowStrict(new Date(date), { addSuffix: true });
}

export function stateVariant(state: string) {
  if (state === "failed" || state === "offline") {
    return "destructive" as const;
  }

  if (state === "completed" || state === "idle") {
    return "secondary" as const;
  }

  return "default" as const;
}

export function formatDuration(durationMs: number | null) {
  if (durationMs === null) {
    return "—";
  }

  if (durationMs < 1_000) {
    return `${durationMs} ms`;
  }

  if (durationMs < 60_000) {
    return `${(durationMs / 1_000).toFixed(1)} s`;
  }

  if (durationMs < 3_600_000) {
    return `${(durationMs / 60_000).toFixed(1)} min`;
  }

  const hours = Math.floor(durationMs / 3_600_000);
  const minutes = Math.round((durationMs % 3_600_000) / 60_000);

  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}
