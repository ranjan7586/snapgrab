import { spawn } from "child_process";
import { detectPlatform } from "./platform";
import { ExtractionError, ExtractResult, MediaFormat, MediaItem, MediaKind } from "../types";

const YTDLP_PATH = process.env.YTDLP_PATH || "yt-dlp";
const EXTRACT_TIMEOUT_MS = 25_000;
// Safety valve: if a URL turns out to be a whole channel/playlist rather
// than a single post, refuse instead of trying to extract hundreds of items.
const MAX_PLAYLIST_ENTRIES = 20;

interface RawFormat {
  format_id?: string;
  ext?: string;
  url?: string;
  vcodec?: string;
  acodec?: string;
  width?: number | null;
  height?: number | null;
  filesize?: number | null;
  filesize_approx?: number | null;
  tbr?: number | null;
  format_note?: string;
}

interface RawEntry {
  id?: string;
  display_id?: string;
  title?: string;
  description?: string;
  duration?: number | null;
  thumbnail?: string | null;
  thumbnails?: { url: string }[];
  url?: string;
  ext?: string;
  width?: number | null;
  height?: number | null;
  vcodec?: string;
  acodec?: string;
  formats?: RawFormat[];
  uploader?: string;
  uploader_id?: string;
  channel?: string;
  _type?: string;
  entries?: RawEntry[];
}

/** Runs `yt-dlp -j <url>` and returns the parsed JSON (or throws ExtractionError). */
function runYtDlp(url: string): Promise<RawEntry> {
  return new Promise((resolve, reject) => {
    const args = [
      "--no-warnings",
      "--no-progress",
      "--dump-json",
      "--no-check-certificates",
      "--geo-bypass",
      "--socket-timeout",
      "15",
      url,
    ];

    const child = spawn(YTDLP_PATH, args, { stdio: ["ignore", "pipe", "pipe"] });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new ExtractionError("The extractor took too long to respond. Try again.", 504, "TIMEOUT"));
    }, EXTRACT_TIMEOUT_MS);

    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(new ExtractionError(`yt-dlp is not available on this server (${err.message}).`, 500, "YTDLP_MISSING"));
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        const reason = stderr.split("\n").filter(Boolean).pop() || "Unknown error";
        reject(new ExtractionError(`Could not read that link (${reason.replace(/^ERROR:\s*/, "")}).`, 422, "YTDLP_ERROR"));
        return;
      }
      try {
        // yt-dlp -j prints one JSON object per line for playlists; for a
        // single post it's just one line. Combine into a single root object.
        const lines = stdout.trim().split("\n").filter(Boolean);
        if (lines.length === 1) {
          resolve(JSON.parse(lines[0]));
        } else {
          const entries = lines.map((l) => JSON.parse(l));
          resolve({ _type: "playlist", entries });
        }
      } catch {
        reject(new ExtractionError("Got an unexpected response while reading that link.", 502, "PARSE_ERROR"));
      }
    });
  });
}

function humanSize(bytes: number | null): number | null {
  return bytes && bytes > 0 ? Math.round(bytes) : null;
}

function qualityLabel(f: RawFormat): string {
  if (f.vcodec && f.vcodec !== "none") {
    return f.height ? `${f.height}p` : f.format_note || "Video";
  }
  if (f.acodec && f.acodec !== "none") return `Audio (${(f.ext || "audio").toUpperCase()})`;
  return f.format_note || f.ext?.toUpperCase() || "File";
}

function toMediaFormat(f: RawFormat): MediaFormat | null {
  if (!f.url) return null;
  const kind: MediaKind =
    f.vcodec && f.vcodec !== "none" ? "video" : f.acodec && f.acodec !== "none" ? "audio" : "video";
  const hasAudio = f.acodec !== "none" && f.acodec !== undefined;
  return {
    formatId: f.format_id || `${f.ext}-${f.height ?? "na"}`,
    ext: f.ext || "mp4",
    label: qualityLabel(f),
    filesizeBytes: humanSize(f.filesize ?? f.filesize_approx ?? null),
    width: f.width ?? null,
    height: f.height ?? null,
    url: f.url,
    kind,
    hasAudio,
    // A video-only stream (typical for 1080p+ YouTube) can't be downloaded
    // as-is — the frontend routes these through /api/download-merged instead
    // of the plain proxy. See routes/downloadMerged.ts for how that works.
    needsMerge: kind === "video" && !hasAudio,
  };
}

/**
 * Picks a clean, deduplicated set of formats to show the user: every
 * progressive (video+audio already muxed) quality, highest video-only
 * quality as a bonus, and the best audio-only track. We deliberately skip
 * exposing every single adaptive stream yt-dlp finds — most of them are
 * redundant and would just clutter the quality picker.
 */
function pickFormats(entry: RawEntry): MediaFormat[] {
  const raw = entry.formats && entry.formats.length > 0 ? entry.formats : null;

  if (!raw) {
    // Single direct URL (typical for Instagram photo posts, some FB videos).
    if (!entry.url) return [];
    const single = toMediaFormat({
      format_id: "direct",
      ext: entry.ext || (entry.vcodec && entry.vcodec !== "none" ? "mp4" : "jpg"),
      url: entry.url,
      vcodec: entry.vcodec,
      acodec: entry.acodec,
      width: entry.width ?? null,
      height: entry.height ?? null,
    });
    return single ? [single] : [];
  }

  const progressive = raw.filter((f) => f.vcodec && f.vcodec !== "none" && f.acodec && f.acodec !== "none" && f.url);
  const videoOnly = raw.filter((f) => f.vcodec && f.vcodec !== "none" && (!f.acodec || f.acodec === "none") && f.url);
  const audioOnly = raw.filter((f) => (!f.vcodec || f.vcodec === "none") && f.acodec && f.acodec !== "none" && f.url);

  const byHeightDesc = (a: RawFormat, b: RawFormat) => (b.height ?? 0) - (a.height ?? 0);
  const dedupeByHeight = (list: RawFormat[]) => {
    const seen = new Set<number>();
    return list.sort(byHeightDesc).filter((f) => {
      const h = f.height ?? -1;
      if (seen.has(h)) return false;
      seen.add(h);
      return true;
    });
  };

  const chosen: RawFormat[] = [];
  chosen.push(...dedupeByHeight(progressive));

  // If there's no progressive stream at all (common for 1080p+ YouTube),
  // surface the single best video-only stream so the user isn't stuck with
  // low quality. toMediaFormat() marks it needsMerge: true, and the
  // frontend routes it through /api/download-merged to add audio back in
  // (see that route for how the video+audio merge actually happens).
  if (progressive.length === 0 && videoOnly.length > 0) {
    chosen.push(dedupeByHeight(videoOnly)[0]);
  }

  const bestAudio = [...audioOnly].sort((a, b) => (b.tbr ?? 0) - (a.tbr ?? 0))[0];
  if (bestAudio) chosen.push(bestAudio);

  return chosen.map(toMediaFormat).filter((f): f is MediaFormat => f !== null);
}

function toMediaItem(entry: RawEntry, index: number): MediaItem {
  const formats = pickFormats(entry);
  const kind: MediaKind = formats.some((f) => f.kind === "video")
    ? "video"
    : formats.some((f) => f.kind === "audio")
    ? "audio"
    : "image";

  return {
    id: entry.id || entry.display_id || `item-${index}`,
    kind,
    thumbnail: entry.thumbnail || entry.thumbnails?.at(-1)?.url || null,
    durationSeconds: entry.duration ?? null,
    formats,
  };
}

export async function extract(url: string): Promise<ExtractResult> {
  const platform = detectPlatform(url);
  if (!platform) {
    throw new ExtractionError("Unsupported link. Paste an Instagram, Facebook, or YouTube link.", 400, "UNSUPPORTED_PLATFORM");
  }

  const root = await runYtDlp(url);

  const isPlaylist = root._type === "playlist" && Array.isArray(root.entries);
  if (isPlaylist && (root.entries?.length ?? 0) > MAX_PLAYLIST_ENTRIES) {
    throw new ExtractionError(
      "That looks like a whole channel or playlist, not a single post. Paste a link to one video/post.",
      400,
      "PLAYLIST_TOO_LARGE"
    );
  }

  const entries = isPlaylist ? root.entries! : [root];
  const items = entries.map(toMediaItem).filter((item) => item.formats.length > 0);

  if (items.length === 0) {
    throw new ExtractionError(
      "Couldn't find a downloadable video or image at that link. It may be private, deleted, or age-restricted.",
      422,
      "NO_MEDIA_FOUND"
    );
  }

  return {
    platform,
    sourceUrl: url,
    title: root.title ?? null,
    description: root.description ?? null,
    author: root.uploader || root.channel || root.uploader_id || null,
    authorAvatar: null,
    thumbnail: root.thumbnail || items[0].thumbnail,
    isCarousel: items.length > 1,
    items,
  };
}
