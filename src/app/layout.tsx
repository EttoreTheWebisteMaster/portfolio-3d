import type { Metadata } from "next";
import {
  Alumni_Sans,
  Caveat,
  Instrument_Sans,
  Tac_One,
} from "next/font/google";
import "./globals.css";

const marquee = Tac_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-marquee-src",
});
const poster = Alumni_Sans({
  subsets: ["latin"],
  variable: "--font-poster-src",
});
const reading = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-reading-src",
});
const pencil = Caveat({ subsets: ["latin"], variable: "--font-pencil-src" });

export const metadata: Metadata = {
  title: { default: "Ettore Serra", template: "%s · Ettore Serra" },
  description: "Ettore Serra's personal website and portfolio.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="it"
      className={`${marquee.variable} ${poster.variable} ${reading.variable} ${pencil.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
