import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import { siteConfig } from "@/shared/config/site";
import { Providers } from "@/shared/components/app/providers";
import "./globals.css";

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-nunito-sans",
  display: "swap",
});

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
    <Providers fontClassName={nunitoSans.variable}>{children}</Providers>
  );
}
