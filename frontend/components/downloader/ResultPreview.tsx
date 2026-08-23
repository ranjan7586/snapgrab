"use client";

import { motion } from "framer-motion";
import { User, VolumeX } from "lucide-react";
import type { ExtractResult, MediaItem } from "@/lib/types";
import { formatDuration, slugify } from "@/lib/utils";
import { QualityButton } from "./QualityButton";
import { buildDownloadUrl } from "@/lib/api";

function MediaPreview({ item }: { item: MediaItem }) {
  // Prefer a format that already has audio for the inline preview. Only
  // fall back to a video-only (needsMerge) stream — silent until the user
  // actually downloads it — when that's the sole video option available.
  const bestVideo =
    item.formats.find((f) => f.kind === "video" && !f.needsMerge) ??
    item.formats.find((f) => f.kind === "video");
  const bestImage = item.formats.find((f) => f.kind === "image");

  if (bestVideo) {
    return (
      <div className="relative">
        <video
          controls
          poster={item.thumbnail ?? undefined}
          preload="metadata"
          className="aspect-[9/16] w-full rounded-xl bg-black object-cover sm:aspect-video"
          src={buildDownloadUrl(bestVideo.url, `preview.${bestVideo.ext}`)}
        />
        {bestVideo.needsMerge && (
          <span className="pointer-events-none absolute left-2 top-2 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
            <VolumeX size={12} /> Preview only
          </span>
        )}
      </div>
    );
  }

  if (bestImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- source host is unpredictable (rotating CDN subdomains), so next/image's domain allowlist doesn't fit here.
      <img
        src={buildDownloadUrl(bestImage.url, `preview.${bestImage.ext}`)}
        alt="Preview"
        className="w-full rounded-xl object-cover"
      />
    );
  }

  return null;
}

function ItemCard({ item, filenameBase, sourceUrl }: { item: MediaItem; filenameBase: string; sourceUrl: string }) {
  return (
    <div className="glass overflow-hidden rounded-2xl p-3">
      <div className="relative">
        <MediaPreview item={item} />
        {item.durationSeconds ? (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
            {formatDuration(item.durationSeconds)}
          </span>
        ) : null}
      </div>
      <div className="mt-3 space-y-2">
        {item.formats.map((format) => (
          <QualityButton
            key={format.formatId}
            format={format}
            sourceUrl={sourceUrl}
            filename={`${filenameBase}-${format.label}`.replace(/\s+/g, "-")}
          />
        ))}
      </div>
    </div>
  );
}

export function ResultPreview({ result }: { result: ExtractResult }) {
  const filenameBase = slugify(result.title || result.author || result.platform);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mt-6"
    >
      {(result.title || result.author) && (
        <div className="mb-4 flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-violet/12 text-accent-violet">
            <User size={16} />
          </span>
          <div className="min-w-0">
            {result.author && <p className="truncate text-sm font-semibold text-foreground">{result.author}</p>}
            {result.title && <p className="line-clamp-2 text-sm text-muted">{result.title}</p>}
          </div>
        </div>
      )}

      {result.isCarousel ? (
        <div>
          <p className="mb-3 text-sm font-medium text-muted">
            {result.items.length} items found — download any of them individually:
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((item, i) => (
              <ItemCard
                key={item.id}
                item={item}
                filenameBase={`${filenameBase}-${i + 1}`}
                sourceUrl={result.sourceUrl}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-sm">
          <ItemCard item={result.items[0]} filenameBase={filenameBase} sourceUrl={result.sourceUrl} />
        </div>
      )}
    </motion.div>
  );
}
