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

  const calendarRange: DateRange | undefined = useMemo(() => {
    if (from && to) {
      return { from, to };
    }

    return defaultRange;
  }, [defaultRange, from, to]);

  const range = useMemo(() => formatDomainDateRange(calendarRange), [calendarRange]);

  return {
    calendarRange,
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
  const { calendarRange, selectedRange, keys, setState } = useChartPeriodFilter({
    defaultDays,
    paramKey,
  });
  const [open, setOpen] = useState(false);

  const selectValue = useMemo(() => {
    if (!calendarRange?.from || !calendarRange?.to) {
      return "custom";
    }

    const diff = differenceInCalendarDays(calendarRange.to, calendarRange.from) + 1;
    const match = options.find((option) => option.value === diff);

    return match ? String(match.value) : "custom";
  }, [calendarRange, options]);

  const presetValue = selectValue === "custom" ? undefined : selectValue;

  const handlePresetChange = (value?: string) => {
    if (!value || value === "custom") {
      return;
    }

    const presetRange = createRangeFromDays(Number(value));

    setState({
      [keys.fromKey]: presetRange.from ?? null,
      [keys.toKey]: presetRange.to ?? null,
    });
  };

  const handlePresetClick = (value: string) => {
    handlePresetChange(value);
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
    formatDateRange(calendarRange) ??
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
      <PopoverContent align="start" className="w-auto p-0" sideOffset={8}>
        <div className="flex flex-col gap-0 sm:flex-row">
          <div className="border-b border-border sm:hidden">
            <div className="p-4">
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
            </div>
          </div>
          <div className="hidden flex-col gap-0 border-r border-border py-4 pl-4 pr-4 sm:flex">
            {options.map((option) => {
              const isActive = presetValue === String(option.value);

              return (
                <button
                  className={`rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                  key={option.value}
                  onClick={() => handlePresetClick(String(option.value))}
                  type="button"
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <div className="p-4">
            <Calendar
              disabled={{ after: new Date() }}
              mode="range"
              numberOfMonths={1}
              onSelect={handleCalendarSelect}
              selected={(selectedRange ?? calendarRange) as DateRange | undefined}
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
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

function formatDateRange(range?: DateRange) {
  if (!range?.from || !range?.to) return null;

  return `${format(range.from, "MMM d, yyyy")} - ${format(range.to, "MMM d, yyyy")}`;
}

function formatDomainDateRange(range?: DateRange) {
  if (!range?.from || !range?.to) return undefined;

  return { end: range.to, start: range.from };
}
