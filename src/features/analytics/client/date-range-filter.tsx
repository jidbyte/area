import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";
import {
  RANGE_PRESETS,
  type ResolvedRange,
} from "@/features/analytics/server/date-range";

const PRESET_LABELS: Record<(typeof RANGE_PRESETS)[number], string> = {
  D: "Day",
  W: "Week",
  M: "Month",
  Y: "Year",
  MAX: "Max",
};

export function DateRangeFilter({
  basePath,
  range,
}: {
  basePath: string;
  range: ResolvedRange;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1 text-sm">
        {RANGE_PRESETS.map((preset) => (
          <a
            key={preset}
            href={`${basePath}?range=${preset}`}
            className={cn(
              "rounded-md px-2 py-1",
              range.preset === preset
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            {PRESET_LABELS[preset]}
          </a>
        ))}
      </div>

      <details className="relative" open={range.preset === "custom"}>
        <summary
          className={cn(
            "cursor-pointer list-none rounded-md px-2 py-1 text-sm",
            range.preset === "custom"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent",
          )}
        >
          Custom
        </summary>

        <form
          action={basePath}
          method="GET"
          className="bg-popover absolute right-0 z-10 mt-2 flex flex-col gap-2 rounded-md border p-3 shadow-md"
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

          <p className="text-muted-foreground text-xs">
            Up to 5 years, capped at today.
          </p>

          <Button type="submit" size="sm">
            Apply
          </Button>
        </form>
      </details>
    </div>
  );
}
