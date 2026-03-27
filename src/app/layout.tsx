import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import LenisProvider from "@/components/providers/LenisProvider";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tansi Motors | Hiring Dashboard",
  description: "Internal recruiting management system for Tansi Motors",
};

import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="bg-zinc-50 font-sans selection:bg-zinc-900 selection:text-white">
        <LenisProvider>{children}</LenisProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
