import type { Metadata } from "next";
import "./globals.css";
import { serif, sans, mono } from "./fonts";

export const metadata: Metadata = {
  title: "agenTurn",
  description: "Panel de gestión de turnos",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "agenTurn" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <meta name="theme-color" content="#6366f1" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
