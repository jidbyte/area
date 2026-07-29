export const RANGE_PRESETS = ["D", "W", "M", "Y", "MAX"] as const;
export type RangePreset = (typeof RANGE_PRESETS)[number] | "custom";

export const DEFAULT_RANGE_PRESET: RangePreset = "M";

const MAX_SPAN_YEARS = 5;

export type ResolvedRange = {
  preset: RangePreset;
  start: Date;
  end: Date;
  granularity: "hour" | "day" | "month";
  /** For pre-filling the custom-range form and for links that need to echo the current range. */
  fromParam: string;
  toParam: string;
};

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function startOfWeek(d: Date): Date {
  // Monday-start week, matching how most shop owners think about "this week."
  const copy = startOfDay(d);
  const day = copy.getDay(); // 0 = Sunday
  const diff = day === 0 ? 6 : day - 1;
  copy.setDate(copy.getDate() - diff);
  return copy;
}

function startOfMonth(d: Date): Date {
  const copy = startOfDay(d);
  copy.setDate(1);
  return copy;
}

function startOfYear(d: Date): Date {
  const copy = startOfDay(d);
  copy.setMonth(0, 1);
  return copy;
}

function toDateParam(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function granularityFor(
  start: Date,
  end: Date,
  preset: RangePreset,
): ResolvedRange["granularity"] {
  if (preset === "D") return "hour";
  const days = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (days <= 60) return "day";
  return "month";
}

/**
 * Reads `range` (and `from`/`to` for custom) from search params and resolves
 * a concrete, clamped date window. Used identically by the Dashboard and
 * Analytics pages so they always agree on what "this range" means.
 */
export function resolveDateRange(searchParams: {
  range?: string;
  from?: string;
  to?: string;
}): ResolvedRange {
  const now = new Date();
  const maxStart = new Date(now);
  maxStart.setFullYear(maxStart.getFullYear() - MAX_SPAN_YEARS);

  const requested = searchParams.range;
  const preset: RangePreset =
    requested === "custom"
      ? "custom"
      : (RANGE_PRESETS as readonly string[]).includes(requested ?? "")
        ? (requested as RangePreset)
        : DEFAULT_RANGE_PRESET;

  if (preset === "custom") {
    const parsedFrom = searchParams.from
      ? new Date(searchParams.from)
      : maxStart;
    const parsedTo = searchParams.to ? new Date(searchParams.to) : now;

    let start = Number.isNaN(parsedFrom.getTime())
      ? maxStart
      : startOfDay(parsedFrom);
    let end = Number.isNaN(parsedTo.getTime()) ? now : parsedTo;

    // Clamp: never before the 5-year ceiling, never after now, never inverted.
    if (start < maxStart) start = maxStart;
    if (end > now) end = now;
    if (start > end) start = end;

    // Clamp span to 5 years even if from/to individually looked valid.
    const spanMs = end.getTime() - start.getTime();
    const maxSpanMs = MAX_SPAN_YEARS * 365 * 24 * 60 * 60 * 1000;
    if (spanMs > maxSpanMs) start = new Date(end.getTime() - maxSpanMs);

    return {
      preset,
      start,
      end,
      granularity: granularityFor(start, end, preset),
      fromParam: toDateParam(start),
      toParam: toDateParam(end),
    };
  }

  const start =
    preset === "D"
      ? startOfDay(now)
      : preset === "W"
        ? startOfWeek(now)
        : preset === "M"
          ? startOfMonth(now)
          : preset === "Y"
            ? startOfYear(now)
            : maxStart; // MAX

  return {
    preset,
    start,
    end: now,
    granularity: granularityFor(start, now, preset),
    fromParam: toDateParam(start),
    toParam: toDateParam(now),
  };
}
