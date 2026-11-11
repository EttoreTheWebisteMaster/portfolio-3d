import type { Metadata, Viewport } from "next";
import { preload } from "react-dom";
import {
  Alumni_Sans,
  Caveat,
  Instrument_Sans,
  Tac_One,
} from "next/font/google";
import ButtonFx from "@/components/ui/ButtonFx";
import { MODEL_URL } from "@/lib/assets";

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
  title: {
    default: "Ettore Serra · Designer & engineer",
    template: "%s · Ettore Serra",
  },
  description:
    "Ettore Serra, designer and full-stack engineer from Turin. React, Next.js, Three.js and GSAP: interfaces people remember.",
  openGraph: {
    title: "Ettore Serra · Designer & engineer",
    description: "Six years turning ideas into interfaces people remember.",
    type: "website",
    locale: "en_GB",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#0b0a09" };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Start the robot downloading with the HTML, before any script runs.
  preload(MODEL_URL, { as: "fetch", crossOrigin: "anonymous" });
  return (
    <html
      lang="en"
      className={`${marquee.variable} ${poster.variable} ${reading.variable} ${pencil.variable}`}
    >
      <body>
        {children}
        <ButtonFx />
      </body>
    </html>
  );
}
