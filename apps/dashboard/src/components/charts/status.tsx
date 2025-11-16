import { Delta } from "@basango/domain/models";
import { cn } from "@basango/ui/lib/utils";
import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react";

import { formatNumber } from "#dashboard/utils/utils";

type StatusProps = {
  value: Delta | undefined;
  percentage?: boolean;
  icons?: boolean;
  sign?: boolean;
};

export function Status({ value, percentage = false, icons = true, sign = true }: StatusProps) {
  if (value === undefined) {
    return <span className="text-muted-foreground">0</span>;
  }

  const color = value.delta >= 0 ? "text-emerald-600" : "text-rose-600";
  const icon =
    value.delta >= 0 ? (
      <ArrowUpRightIcon className={cn("size-4", color)} />
    ) : (
      <ArrowDownRightIcon className={cn("size-4", color)} />
    );

  return (
    <>
      {icons && icon}
      <span className={cn("font-semibold", color)}>
        {sign && value.sign}
        {percentage
          ? `${formatNumber(Math.abs(value.percentage))}%`
          : formatNumber(Math.abs(value.delta))}
      </span>
    </>
  );
}
