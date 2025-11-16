"use client";

import { Button } from "@basango/ui/components/button";
import { Calendar } from "@basango/ui/components/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@basango/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@basango/ui/components/select";
import { ToggleGroup, ToggleGroupItem } from "@basango/ui/components/toggle-group";
import { differenceInCalendarDays, format, subDays } from "date-fns";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { parseAsInteger, parseAsIsoDate, useQueryStates } from "nuqs";
import { useMemo, useState } from "react";
import { DateRange } from "react-day-picker";

const DEFAULT_PERIOD_OPTIONS = [
  { label: "Last 7 days", value: 7 },
  { label: "Last 30 days", value: 30 },
  { label: "Last 3 months", value: 90 },
  { label: "Last 6 months", value: 180 },
  { label: "Last 12 months", value: 365 },
] as const;

type DateInput = number | Date | null | undefined;

const createRangeFromDays = (days: number): DateRange => {
  const end = new Date();

  return {
    from: subDays(end, Math.max(days - 1, 0)),
    to: end,
  };
};

const DEFAULT_LIMIT_OPTIONS = [
  { label: "Top 10", value: 10 },
  { label: "Top 20", value: 20 },
  { label: "Top 50", value: 50 },
] as const;

type ChartPeriodFilterOptions = {
  defaultDays?: number;
  paramKey?: string;
};

type ChartLimitFilterOptions = {
  defaultValue?: number;
  paramKey?: string;
};

export function useChartPeriodFilter(options: ChartPeriodFilterOptions = {}) {
  const { defaultDays = 30, paramKey = "chartPeriod" } = options;
  const fromKey = `${paramKey}From`;
  const toKey = `${paramKey}To`;

  const defaultRange = useMemo(() => createRangeFromDays(defaultDays), [defaultDays]);

  const [state, setState] = useQueryStates({
    [fromKey]: parseAsIsoDate,
    [toKey]: parseAsIsoDate,
  });

  const from = state[fromKey] ?? undefined;
  const to = state[toKey] ?? undefined;

  const selectedRange = useMemo(() => {
    if (from || to) {
      return { from, to };
    }

    return undefined;
  }, [from, to]);

  const range = useMemo(() => {
    if (from && to) {
      return { from, to };
    }

    return defaultRange;
  }, [defaultRange, from, to]);

  return {
    defaultDays,
    keys: { fromKey, toKey },
    range,
    selectedRange,
    setState,
  };
}

export function useChartLimitFilter(options: ChartLimitFilterOptions = {}) {
  const { defaultValue = 10, paramKey = "chartLimit" } = options;
  const [state, setState] = useQueryStates({
    [paramKey]: parseAsInteger.withDefault(defaultValue),
  });

  const limit = state[paramKey];

  return {
    limit,
    setLimit: (value: number) => {
      setState({ [paramKey]: value });
    },
  };
}

type ChartPeriodPickerProps = ChartPeriodFilterOptions & {
  options?: ReadonlyArray<{ label: string; value: number }>;
};

export function ChartPeriodPicker({
  defaultDays = 30,
  options = DEFAULT_PERIOD_OPTIONS,
  paramKey = "chartPeriod",
  disabled,
}: ChartPeriodPickerProps & { disabled?: boolean }) {
  const { range, selectedRange, keys, setState } = useChartPeriodFilter({ defaultDays, paramKey });
  const [open, setOpen] = useState(false);

  const selectValue = useMemo(() => {
    if (!range?.from || !range?.to) {
      return "custom";
    }

    const diff = differenceInCalendarDays(range.to, range.from) + 1;
    const match = options.find((option) => option.value === diff);

    return match ? String(match.value) : "custom";
  }, [options, range]);

  const handlePresetChange = (value: string) => {
    if (value === "custom") {
      return;
    }

    const presetRange = createRangeFromDays(Number(value));

    setState({
      [keys.fromKey]: presetRange.from ?? null,
      [keys.toKey]: presetRange.to ?? null,
    });
  };

  const handleCalendarSelect = (value: DateRange | undefined) => {
    if (value?.from && value?.to) {
      setState({
        [keys.fromKey]: value.from,
        [keys.toKey]: value.to,
      });
    } else {
      setState({
        [keys.fromKey]: null,
        [keys.toKey]: null,
      });
    }
  };

  const displayLabel =
    formatDateRange(range) ??
    options.find((option) => String(option.value) === selectValue)?.label ??
    "Select range";

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          className="w-full justify-start gap-2 text-left font-medium sm:w-72"
          type="button"
          variant="outline"
        >
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 truncate">{displayLabel}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-screen space-y-4 p-4 sm:w-[520px]" sideOffset={8}>
        <Select onValueChange={handlePresetChange} value={selectValue}>
          <SelectTrigger>
            <SelectValue placeholder="Quick range" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
            <SelectItem value="custom">Custom range</SelectItem>
          </SelectContent>
        </Select>

        <Calendar
          mode="range"
          numberOfMonths={2}
          onSelect={handleCalendarSelect}
          selected={(selectedRange ?? range) as DateRange | undefined}
        />

        <div className="flex justify-end gap-2">
          <Button
            onClick={() =>
              setState({
                [keys.fromKey]: null,
                [keys.toKey]: null,
              })
            }
            type="button"
            variant="ghost"
          >
            Reset
          </Button>
          <Button onClick={() => setOpen(false)} type="button">
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

type ChartLimitToggleProps = ChartLimitFilterOptions & {
  options?: ReadonlyArray<{ label: string; value: number }>;
};

export function ChartLimitToggle({
  defaultValue = 10,
  options = DEFAULT_LIMIT_OPTIONS,
  paramKey = "chartLimit",
}: ChartLimitToggleProps) {
  const { limit, setLimit } = useChartLimitFilter({ defaultValue, paramKey });

  return (
    <ToggleGroup
      onValueChange={(value) => {
        if (value) {
          setLimit(Number(value));
        }
      }}
      type="single"
      value={String(limit)}
      variant="outline"
    >
      {options.map((option) => (
        <ToggleGroupItem key={option.value} value={String(option.value)}>
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

function formatDateRange(range?: { from?: DateInput; to?: DateInput }) {
  if (!range?.from || !range?.to) return null;

  return `${format(range.from, "MMM d, yyyy")} - ${format(range.to, "MMM d, yyyy")}`;
}
