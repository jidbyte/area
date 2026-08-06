"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Settings2,
  User,
  Building2,
  Bell,
  Shield,
  CreditCard,
  Monitor,
} from "lucide-react";

import { cn } from "@/shared/lib/utils";

const SETTINGS_SECTIONS = [
  { slug: "general", label: "General", icon: Settings2 },
  { slug: "account", label: "Account", icon: User },
  { slug: "organization", label: "Organization", icon: Building2 },
  { slug: "notifications", label: "Notifications", icon: Bell },
  { slug: "roles", label: "Roles", icon: Shield },
  { slug: "payments", label: "Payments", icon: CreditCard },
  { slug: "sessions", label: "Sessions", icon: Monitor },
] as const;

export function SettingsNav({ storeSlug }: { storeSlug: string }) {
  const pathname = usePathname();

  return (
    <>
      {/* Fixed sidebar on large screens */}
      <nav className="hidden lg:block w-52 shrink-0">
        <ul className="space-y-1">
          {SETTINGS_SECTIONS.map((section) => {
            const href = `/${storeSlug}/settings/${section.slug}`;
            const active = pathname === href;
            return (
              <li key={section.slug}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-surface"
                      : "text-neutral hover:bg-muted/40 hover:text-ink",
                  )}
                >
                  <section.icon className="size-4" />
                  {section.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Horizontal scrollable tabs on small screens */}
      <nav className="lg:hidden -mx-4 mb-4 overflow-x-auto border-b border-muted/40 px-4">
        <ul className="flex gap-1 whitespace-nowrap">
          {SETTINGS_SECTIONS.map((section) => {
            const href = `/${storeSlug}/settings/${section.slug}`;
            const active = pathname === href;
            return (
              <li key={section.slug}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-neutral hover:text-ink",
                  )}
                >
                  <section.icon className="size-3.5" />
                  {section.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
