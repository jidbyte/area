import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import {
  RANGE_PRESETS,
  type ResolvedRange,
} from "@/features/admin/analytics/server/date-range";

const PRESET_TOOLTIPS: Record<(typeof RANGE_PRESETS)[number], string> = {
  D: "Today",
  W: "This week",
  M: "This month",
  Y: "This year",
  "30D": "Last 30 days",
  "90D": "Last 90 days",
  MAX: "Max (10 years)",
};

export function DateRangeFilter({
  basePath,
  range,
}: {
  basePath: string;
  range: ResolvedRange;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 bg-surface/70 p-2 rounded-md w-full">
      <div className="flex gap-1 text-sm">
        {RANGE_PRESETS.map((preset) => (
          <Tooltip key={preset}>
            <TooltipTrigger asChild>
              <a
                href={`${basePath}?range=${preset}`}
                className={cn(
                  "rounded-sm px-2 py-1",
                  range.preset === preset
                    ? "bg-ink text-surface"
                    : "hover:underline",
                )}
              >
                {preset}
              </a>
            </TooltipTrigger>
            <TooltipContent>{PRESET_TOOLTIPS[preset]}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      <details className="relative" open={range.preset === "custom"}>
        <Tooltip>
          <TooltipTrigger asChild>
            <summary
              className={cn(
                "cursor-pointer list-none rounded-md px-2 py-1 text-sm",
                range.preset === "custom"
                  ? "bg-neutral text-surface"
                  : "hover:underline",
              )}
            >
              Custom
            </summary>
          </TooltipTrigger>
          <TooltipContent>Custom period</TooltipContent>
        </Tooltip>

        <form
          action={basePath}
          method="GET"
          className="bg-surface absolute right-0 z-10 mt-2 flex flex-col gap-2 rounded-md border border-neutral p-3 shadow-md"
        >
          <input type="hidden" name="range" value="custom" />

          <label className="flex flex-col gap-1 text-xs">
            From
            <Input
              type="date"
              name="from"
              defaultValue={range.fromParam}
              className="w-40"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs">
            To
            <Input
              type="date"
              name="to"
              defaultValue={range.toParam}
              className="w-40"
            />
          </label>

          <p className="text-neutral text-xs">
            Up to 10 years, capped at today.
          </p>

          <Button type="submit" size="sm">
            Apply
          </Button>
        </form>
      </details>
    </div>
  );
}
