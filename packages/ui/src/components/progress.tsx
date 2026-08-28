import { cn } from "@basango/ui/lib/utils";

type ProgressProps = React.ComponentProps<"div"> & {
  max?: number;
  value?: number;
};

function Progress({ className, max = 100, value = 0, ...props }: ProgressProps) {
  const normalizedValue = Math.min(max, Math.max(0, value));
  const percentage = max > 0 ? (normalizedValue / max) * 100 : 0;

  return (
    <div
      aria-valuemax={max}
      aria-valuemin={0}
      aria-valuenow={normalizedValue}
      className={cn("bg-muted h-2 w-full overflow-hidden rounded-full", className)}
      data-slot="progress"
      role="progressbar"
      {...props}
    >
      <div
        className="bg-primary h-full transition-[width]"
        data-slot="progress-indicator"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export { Progress };
