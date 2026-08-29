import { Badge } from "@basango/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@basango/ui/components/card";
import { Skeleton } from "@basango/ui/components/skeleton";
import { Server, Wifi, WifiOff } from "lucide-react";
import type { ReactNode } from "react";

export function DashboardPanel({
  children,
  description,
  title,
  trailing,
}: {
  children: ReactNode;
  description: string;
  title: string;
  trailing?: ReactNode;
}) {
  return (
    <Card className="pt-0">
      <CardHeader className="flex items-start gap-2 space-y-0 border-b py-5 sm:flex-row sm:items-center">
        <div className="grid flex-1 gap-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {trailing}
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">{children}</CardContent>
    </Card>
  );
}

type LiveBadgeProps = {
  status: "connecting" | "disconnected" | "live";
};

export function LiveBadge({ status }: LiveBadgeProps) {
  const connected = status === "live";
  const label = status === "connecting" ? "Connecting" : connected ? "Live" : "Disconnected";

  return (
    <Badge
      className={
        connected
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      }
      title={
        connected
          ? "Realtime updates are connected"
          : "Realtime updates are unavailable; data will not refresh automatically"
      }
      variant="outline"
    >
      {connected ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
      {label}
    </Badge>
  );
}

export function IngestionOperationsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton className="h-32" key={index} />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <Skeleton className="h-[360px]" />
        <Skeleton className="h-[360px]" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <Skeleton className="h-[360px]" />
        <Skeleton className="h-[360px]" />
      </div>
      <Skeleton className="h-[34rem]" />
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-md border border-dashed bg-muted/20 px-4">
      <div className="text-center">
        <Server className="mx-auto mb-2 size-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
