import type { Metadata } from "next";
import { PlatformHero } from "@/components/sections/PlatformHero";
import { AboutSection } from "@/components/sections/AboutSection";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { FAQ } from "@/components/sections/FAQ";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageSeo, softwareAppJsonLd, SITE_URL } from "@/lib/seo";

const PATH = "/youtube-video-downloader";

export const metadata: Metadata = pageSeo({
  title: "YouTube Video Downloader — Save Videos & Shorts in HD or MP3 | Snapgrab",
  description:
    "Download YouTube videos and Shorts in HD, or grab audio-only MP3/M4A. Paste the link, pick a resolution, download instantly — free, no login.",
  path: PATH,
  keywords: [
    "youtube video downloader",
    "youtube to mp4",
    "youtube shorts downloader",
    "youtube audio downloader",
    "download youtube video hd",
  ],
});

const FAQ_ITEMS = [
  {
    question: "What's the highest quality I can download?",
    answer:
      "Whatever the uploader made available — Snapgrab lists every resolution YouTube offers for that video, including 1080p and above where the video-only stream is provided.",
  },
  {
    question: "Can I download just the audio?",
    answer: "Yes — an audio-only option is included whenever YouTube provides one, useful for music or podcasts.",
  },
  {
    question: "Does it work with YouTube Shorts?",
    answer: "Yes, Shorts links work exactly the same way as regular video links.",
  },
  {
    question: "Can I download an entire playlist at once?",
    answer:
      "No — Snapgrab is built for downloading one video at a time. Paste the direct link to a single video rather than a playlist or channel URL.",
  },
];

export default function YoutubeDownloaderPage() {
  return (
    <>
      <JsonLd
        data={softwareAppJsonLd({
          name: "YouTube Video Downloader",
          description: "Download YouTube videos and Shorts in HD, or audio-only, free.",
          url: `${SITE_URL}${PATH}`,
        })}
      />

      <PlatformHero
        platform="youtube"
        badge="▶️ Videos · Shorts · Audio"
        heading="Download YouTube videos in"
        highlight="any quality"
        description="From 4K down to a small MP3, get exactly the format you need from any public YouTube video or Short."
      />

      <AboutSection
        title="One link, every YouTube quality"
        paragraphs={[
          "YouTube streams video in many separate quality tiers, and the highest resolutions are often split into a video-only track and a separate audio track. Snapgrab handles that complexity for you — paste a link and you'll see a clean list of resolutions, each ready to save with one click.",
          "Prefer just the sound? An audio-only option is included whenever the video provides one, which is handy for saving music, lectures, or podcasts without the video weight.",
          "Shorts are treated the same as regular videos, so the same link box works for both. To keep things fast and predictable, Snapgrab processes one video at a time rather than entire playlists or channels.",
        ]}
      />

      <HowItWorks />
      <FAQ items={FAQ_ITEMS} />
    </>
  );
}
