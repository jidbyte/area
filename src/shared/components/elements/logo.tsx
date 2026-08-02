"use client";

import * as React from "react";
import Image from "next/image";
import { useTheme } from "next-themes";

import { brandAssets } from "@/assets/brand";
import { cn } from "@/shared/lib/utils";

export function Logo({
  className,
  height = 32,
}: {
  className?: string;
  height?: number;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  // Before mount we don't know the persisted theme yet. Reserve the space
  // with an invisible placeholder so nothing jumps once it resolves.
  if (!mounted) {
    return <div className={cn("invisible", className)} style={{ height }} />;
  }

  const src = resolvedTheme === "dark" ? brandAssets.logoLight : brandAssets.logoDark;

  return (
    <Image
      src={src}
      alt="AREA"
      height={height}
      style={{ height, width: "auto" }}
      className={className}
      priority
    />
  );
}
