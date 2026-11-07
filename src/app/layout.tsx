import type { Metadata } from "next";
import { Inter_Tight, Space_Grotesk } from "next/font/google";
import "./globals.css";

const sans = Inter_Tight({ subsets: ["latin"], variable: "--font-sans-src" });
const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display-src",
});

export const metadata: Metadata = {
  title: { default: "Made by Ettore", template: "%s · Made by Ettore" },
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" className={`${sans.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
