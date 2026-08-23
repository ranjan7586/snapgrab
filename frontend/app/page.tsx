import { DownloaderCard } from "@/components/downloader/DownloaderCard";
import { GradientOrbs } from "@/components/ui/GradientOrbs";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Features } from "@/components/sections/Features";
import { FAQ } from "@/components/sections/FAQ";
import { JsonLd } from "@/components/seo/JsonLd";
import { softwareAppJsonLd, SITE_URL } from "@/lib/seo";

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={softwareAppJsonLd({
          name: "Snapgrab",
          description: "Download Instagram, Facebook and YouTube videos and photos in HD, free.",
          url: SITE_URL,
        })}
      />

      <section className="relative flex flex-col items-center px-5 pb-20 pt-16 text-center sm:pt-24">
        <GradientOrbs />

        <span className="glass mb-6 rounded-full px-4 py-1.5 text-xs font-medium text-muted">
          ⚡ Instagram · Facebook · YouTube — one downloader
        </span>

        <h1 className="max-w-3xl font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          Save any video in{" "}
          <span className="gradient-text">seconds</span>, not steps
        </h1>

        <p className="mt-5 max-w-xl text-balance text-base text-muted sm:text-lg">
          Paste a link from Instagram, Facebook, or YouTube and get every available quality —
          instantly, free, and without a watermark.
        </p>

        <div className="mt-10 flex w-full justify-center">
          <DownloaderCard />
        </div>
      </section>

      <HowItWorks />
      <Features />
      <FAQ />
    </>
  );
}
