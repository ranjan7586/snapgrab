import type { Metadata } from "next";
import { PlatformHero } from "@/components/sections/PlatformHero";
import { AboutSection } from "@/components/sections/AboutSection";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { FAQ } from "@/components/sections/FAQ";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageSeo, softwareAppJsonLd, SITE_URL } from "@/lib/seo";

const PATH = "/instagram-video-downloader";

export const metadata: Metadata = pageSeo({
  title: "Instagram Video Downloader — Save Reels, Posts & IGTV in HD | Snapgrab",
  description:
    "Download Instagram Reels, videos, photos, carousels and IGTV in HD for free. Just paste the Instagram link — no login, no app, no watermark.",
  path: PATH,
  keywords: [
    "instagram video downloader",
    "instagram reel downloader",
    "download instagram video",
    "instagram photo downloader",
    "instagram carousel downloader",
  ],
});

const FAQ_ITEMS = [
  {
    question: "Can I download Instagram Reels with this tool?",
    answer:
      "Yes — paste the Reel's share link and Snapgrab will pull the video in the highest quality available, with no Instagram watermark added.",
  },
  {
    question: "Does it work for Instagram carousel posts?",
    answer:
      "Yes. When a post contains multiple photos or videos, Snapgrab detects each slide and lets you download them individually.",
  },
  {
    question: "Can I download a private Instagram account's posts?",
    answer: "No. Only content from public Instagram profiles can be processed, in line with Instagram's own privacy protections.",
  },
  {
    question: "Do I need to install an app?",
    answer: "No installation needed — Snapgrab runs entirely in your browser, on desktop or mobile.",
  },
];

export default function InstagramDownloaderPage() {
  return (
    <>
      <JsonLd
        data={softwareAppJsonLd({
          name: "Instagram Video Downloader",
          description: "Download Instagram Reels, videos, photos and carousels in HD, free.",
          url: `${SITE_URL}${PATH}`,
        })}
      />

      <PlatformHero
        platform="instagram"
        badge="📸 Reels · Posts · Stories · IGTV · Carousels"
        heading="Download any Instagram video in"
        highlight="one paste"
        description="Save Reels, posts, carousels, and IGTV videos straight from Instagram — full quality, no watermark, no account needed."
      />

      <AboutSection
        title="The fastest way to save Instagram videos"
        paragraphs={[
          "Instagram doesn't give you a native way to save Reels or videos from other creators to your camera roll — Snapgrab fills that gap. Paste the link to any public Reel, post, Story highlight, or IGTV episode, and we'll resolve every quality the post actually offers, from a lightweight preview size up to the original upload resolution.",
          "Carousels — posts with multiple photos or video clips swiped together — are handled automatically. Instead of forcing you to download the whole set as one file, Snapgrab breaks each slide out separately so you only save the ones you actually want.",
          "Everything happens the moment you paste the link: there's no waiting queue, no forced app install, and no watermark stamped over the video. Because only publicly available Instagram content can be resolved, private accounts and content you don't have permission to access are never supported.",
        ]}
      />

      <HowItWorks />
      <FAQ items={FAQ_ITEMS} />
    </>
  );
}
