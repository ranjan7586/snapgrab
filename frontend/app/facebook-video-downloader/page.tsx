import type { Metadata } from "next";
import { PlatformHero } from "@/components/sections/PlatformHero";
import { AboutSection } from "@/components/sections/AboutSection";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { FAQ } from "@/components/sections/FAQ";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageSeo, softwareAppJsonLd, SITE_URL } from "@/lib/seo";

const PATH = "/facebook-video-downloader";

export const metadata: Metadata = pageSeo({
  title: "Facebook Video Downloader — Save FB Videos & Watch Links in HD | Snapgrab",
  description:
    "Download public Facebook videos, Watch links, and Reels in HD for free. Paste the Facebook link and choose your quality — no login required.",
  path: PATH,
  keywords: [
    "facebook video downloader",
    "download facebook video",
    "fb video downloader",
    "facebook watch downloader",
    "facebook reels downloader",
  ],
});

const FAQ_ITEMS = [
  {
    question: "What kinds of Facebook links work?",
    answer:
      "Regular video posts, Facebook Watch links, fb.watch short links, and public Facebook Reels are all supported.",
  },
  {
    question: "Can I download videos from a private Facebook group?",
    answer: "No — only videos from public pages, profiles, and groups can be processed.",
  },
  {
    question: "Why does a video only show one quality?",
    answer:
      "Some Facebook videos are only published in a single resolution by the uploader. When more are available, Snapgrab lists every one it finds.",
  },
  {
    question: "Is my Facebook account needed?",
    answer: "No sign-in required. You only need the link to a public video.",
  },
];

export default function FacebookDownloaderPage() {
  return (
    <>
      <JsonLd
        data={softwareAppJsonLd({
          name: "Facebook Video Downloader",
          description: "Download public Facebook videos, Watch links, and Reels in HD, free.",
          url: `${SITE_URL}${PATH}`,
        })}
      />

      <PlatformHero
        platform="facebook"
        badge="🎬 Videos · Watch · Reels"
        heading="Download Facebook videos in"
        highlight="full quality"
        description="Paste any public Facebook video, Watch, or Reels link and save it directly — no browser extension, no login."
      />

      <AboutSection
        title="Save Facebook videos without the browser extension"
        paragraphs={[
          "Facebook videos are easy to watch and hard to keep — there's no built-in download button on most posts. Snapgrab resolves the direct video file behind a public Facebook link, whether it's a standard video post, a Facebook Watch page, a shortened fb.watch link, or a Reel.",
          "Once resolved, you'll see every quality Facebook actually published for that video, so you can pick a smaller file for quick sharing or the original resolution for archiving. The process runs entirely through your browser — no extension to install, no permissions to grant.",
          "As with every source Snapgrab supports, only publicly viewable Facebook content can be processed; videos inside private groups or restricted profiles are intentionally out of reach.",
        ]}
      />

      <HowItWorks />
      <FAQ items={FAQ_ITEMS} />
    </>
  );
}
