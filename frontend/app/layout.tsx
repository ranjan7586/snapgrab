import type { Metadata, Viewport } from "next";
import { Sora, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationJsonLd, pageSeo, websiteJsonLd, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

const display = Sora({ subsets: ["latin"], variable: "--font-display", weight: ["600", "700", "800"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  ...pageSeo({
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description:
      "Free online downloader for Instagram Reels, Posts, Stories & IGTV, Facebook videos, and YouTube videos & Shorts. Paste a link, pick a quality, download instantly — no app, no watermark, no login.",
    path: "/",
    keywords: [
      "instagram video downloader",
      "facebook video downloader",
      "youtube video downloader",
      "reels downloader",
      "download instagram reel",
      "save facebook video",
    ],
  }),
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://snapgrab.example.com"),
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f6fb" },
    { media: "(prefers-color-scheme: dark)", color: "#05050a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${body.variable}`}>
      <body className="min-h-dvh flex flex-col antialiased selection:bg-accent-violet">
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
