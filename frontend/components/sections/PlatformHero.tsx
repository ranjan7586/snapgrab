import { DownloaderCard } from "@/components/downloader/DownloaderCard";
import { GradientOrbs } from "@/components/ui/GradientOrbs";
import type { Platform } from "@/lib/types";

export function PlatformHero({
  platform,
  badge,
  heading,
  highlight,
  description,
}: {
  platform: Platform;
  badge: string;
  heading: string;
  highlight: string;
  description: string;
}) {
  return (
    <section className="relative flex flex-col items-center px-5 pb-20 pt-16 text-center sm:pt-24">
      <GradientOrbs />

      <span className="glass mb-6 rounded-full px-4 py-1.5 text-xs font-medium text-muted">{badge}</span>

      <h1 className="max-w-3xl text-balance font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
        {heading} <span className="gradient-text">{highlight}</span>
      </h1>

      <p className="mt-5 max-w-xl text-balance text-base text-muted sm:text-lg">{description}</p>

      <div className="mt-10 flex w-full justify-center">
        <DownloaderCard lockedPlatform={platform} />
      </div>
    </section>
  );
}
