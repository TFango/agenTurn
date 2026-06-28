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
        <meta name="theme-color" content="#c45c34" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
        {children}
      </body>
    </html>
  );
}
