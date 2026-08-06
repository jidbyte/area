"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";

import { ThemeProvider } from "./theme-provider";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { PageLoader } from "./page-loader";

/**
 * Every layout-level provider the app needs, in one place — Clerk, theme,
 * tooltip context, and the toast host. Keeps `app/layout.tsx` focused on
 * document structure (html/body/fonts) rather than provider wiring.
 *
 * ClerkProvider deliberately wraps the whole document (not just body),
 * matching the structure this app already had — Clerk's own docs allow
 * either placement, but changing it isn't this refactor's job.
 */
export function Providers({
  children,
  fontClassName,
}: {
  children: React.ReactNode;
  fontClassName: string;
}) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#1567d4",
        },
      }}
    >
      <Toaster position="top-right" />

      <html lang="en" suppressHydrationWarning className={fontClassName}>
        <body className="antialiased font-sans">
          <ThemeProvider
            attribute="data-theme"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <TooltipProvider>{children}</TooltipProvider>
            <PageLoader />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
