import type { Metadata } from "next";
import { Cormorant_Garamond, IBM_Plex_Mono, Source_Serif_4 } from "next/font/google";
import { AuthProvider } from "@/lib/auth/context";
import { FilmGrain } from "@/components/shared/FilmGrain";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const serif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-ibm-plex",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "MysteryBox",
  description: "Every clue matters. Everyone has something to hide.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${serif.variable} ${mono.variable} dark h-full`}
    >
      <body className="relative flex min-h-full flex-col bg-ink text-beige">
        <FilmGrain />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
