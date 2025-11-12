import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@basango/ui/globals.css";

import { Toaster } from "@basango/ui/components/sonner";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { Providers } from "./providers";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  description: "Basango : The intelligent news curation platform.",
  metadataBase: new URL("https://dashboard.basango.com"),
  title: "Basango | AI-powered news curation dashboard",
};

export const viewport = {
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)" },
    { media: "(prefers-color-scheme: dark)" },
  ],
  userScalable: false,
  width: "device-width",
};

export default async function RootLayout({
  params,
  children,
}: Readonly<{
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
}>) {
  const { locale } = await params;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NuqsAdapter>
          <Providers locale={locale}>{children}</Providers>
          <Toaster />
        </NuqsAdapter>
      </body>
    </html>
  );
}
