"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { cn } from "@/shared/lib/utils";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const options = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3 max-w-sm">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setTheme(opt.value)}
          className={cn(
            "flex items-center justify-center gap-2 rounded-md border p-3 text-sm font-medium transition-colors",
            mounted && theme === opt.value
              ? "border-primary bg-primary/10 text-primary"
              : "border-muted/40 text-neutral hover:text-ink",
          )}
        >
          <opt.icon className="size-4" />
          {opt.label}
        </button>
      ))}
    </div>
  );
}
