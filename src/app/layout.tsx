import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "FormForge — Build beautiful forms in minutes",
    template: "%s · FormForge",
  },
  description:
    "FormForge is the modern form builder for SaaS teams. Drag and drop questions, add conditional logic, publish, and analyze responses — all in one place.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  openGraph: {
    title: "FormForge",
    description: "Build production-ready forms with conditional logic and analytics.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <TooltipProvider delayDuration={150}>
          {children}
        </TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
