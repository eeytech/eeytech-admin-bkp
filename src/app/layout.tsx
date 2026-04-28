import "./globals.css";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { Toaster } from "@/components/ui/sonner";
import { ReactQueryProvider } from "@/providers/react-query";

import { getSystemSettings } from "@/lib/system-settings";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSystemSettings();
  
  return {
    title: settings.instanceName || "Eeytech Admin",
    description: "Painel central de gerenciamento Eeytech",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} antialiased font-sans`}>
        <ReactQueryProvider>
          <NuqsAdapter>{children}</NuqsAdapter>
        </ReactQueryProvider>
        <Toaster position="bottom-center" richColors theme="light" />
      </body>
    </html>
  );
}