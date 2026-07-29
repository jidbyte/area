import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { siteConfig } from "@/shared/config/site";
import { ThemeProvider } from "@/shared/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#1567d4",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className="antialiased font-sans">
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
