import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TRPCReactProvider } from "@/trpc/react";
import { Providers } from "@/components/Providers";
import { AccessMonitor } from "@/components/AccessMonitor";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Workstation",
  description: "Workstation Schedule Desktop management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="logo-dark-23.jpg" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <AccessMonitor />
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </Providers>
      </body>
    </html>
  );
}
