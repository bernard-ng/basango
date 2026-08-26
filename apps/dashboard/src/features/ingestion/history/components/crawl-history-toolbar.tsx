import { INGESTION_RUN_STATES, type IngestionRunState } from "@basango/domain/models";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@basango/ui/components/select";

import type { CrawlHistorySort } from "../crawl-history-model";

const stateLabels: Record<IngestionRunState, string> = {
  completed: "Completed",
  failed: "Failed",
  preparing: "Preparing",
  running: "Running",
};

export type CrawlHistoryToolbarProps = {
  onSortChange: (value: string | null) => void;
  onStateChange: (value: string | null) => void;
  sort: CrawlHistorySort;
  state: IngestionRunState | "all";
};

export function CrawlHistoryToolbar({
  onSortChange,
  onStateChange,
  sort,
  state,
}: CrawlHistoryToolbarProps) {
  return (
    <div className="flex items-center gap-2">
      <Select onValueChange={onStateChange} value={state}>
        <SelectTrigger className="w-40" size="sm">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {INGESTION_RUN_STATES.map((runState) => (
            <SelectItem key={runState} value={runState}>
              {stateLabels[runState]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select onValueChange={onSortChange} value={sort}>
        <SelectTrigger className="w-44" size="sm">
          <SelectValue placeholder="Latest first" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="latest">Latest first</SelectItem>
          <SelectItem value="slowest">Slowest first</SelectItem>
          <SelectItem value="work">Most work first</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function CrawlHistoryLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
      <Legend colorClassName="bg-emerald-500" label="Normal" />
      <Legend colorClassName="bg-amber-500" label="Elevated" />
      <Legend colorClassName="bg-orange-500" label="High duration" />
      <Legend colorClassName="bg-red-500" label="Failed" />
      <Legend colorClassName="bg-violet-500" label="Active" />
    </div>
  );
}

function Legend({ colorClassName, label }: { colorClassName: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`size-2 rounded-full ${colorClassName}`} />
      {label}
    </span>
  );
}
