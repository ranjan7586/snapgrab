"use client";

import { useState } from "react";
import { Download, Loader2, Music, Sparkles, Video, Image as ImageIcon } from "lucide-react";
import { buildDownloadUrl, buildMergedDownloadUrl } from "@/lib/api";
import { formatBytes } from "@/lib/utils";
import type { MediaFormat } from "@/lib/types";

const ICONS = { video: Video, audio: Music, image: ImageIcon };

export function QualityButton({
  format,
  filename,
  sourceUrl,
}: {
  format: MediaFormat;
  filename: string;
  /** The original pasted post URL — only needed for needsMerge formats, see lib/api.ts. */
  sourceUrl: string;
}) {
  const Icon = ICONS[format.kind];
  const [preparing, setPreparing] = useState(false);

  const href = format.needsMerge
    ? buildMergedDownloadUrl(sourceUrl, format.formatId, `${filename}.mp4`)
    : buildDownloadUrl(format.url, `${filename}.${format.ext}`);

  function handleClick() {
    if (!format.needsMerge) return;
    // Merging video+audio server-side can take a while (yt-dlp has to
    // download both streams and mux them with ffmpeg before the browser
    // sees any bytes), and a plain <a download> gives no progress feedback
    // during that wait. There's no reliable "download finished" event to
    // hook for a navigation-triggered download, so we just clear this after
    // a generous delay rather than leaving it stuck on forever.
    setPreparing(true);
    setTimeout(() => setPreparing(false), 45_000);
  }

  return (
    <a
      href={href}
      download
      onClick={handleClick}
      className="group flex items-center justify-between gap-3 rounded-xl border border-surface-border bg-surface px-4 py-3 text-sm transition hover:border-accent-violet/50 hover:bg-accent-violet/8"
    >
      <span className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-accent-violet/12 text-accent-violet">
          {preparing ? <Loader2 size={15} className="animate-spin" /> : <Icon size={15} />}
        </span>
        <span className="flex flex-col text-left">
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            {format.label}
            {format.needsMerge && !preparing && (
              <span
                title="Video and audio are combined on download — may take a little longer"
                className="flex items-center gap-0.5 rounded-full bg-accent-violet/12 px-1.5 py-0.5 text-[10px] font-semibold text-accent-violet"
              >
                <Sparkles size={9} /> HD+audio
              </span>
            )}
          </span>
          <span className="text-xs text-muted">
            {preparing
              ? "Preparing your file — this can take up to a minute…"
              : `${format.ext.toUpperCase()}${format.filesizeBytes ? ` · ${format.needsMerge ? "~" : ""}${formatBytes(format.filesizeBytes)}` : ""}`}
          </span>
        </span>
      </span>
      <Download size={16} className="shrink-0 text-muted transition group-hover:text-accent-violet" />
    </a>
  );
}
