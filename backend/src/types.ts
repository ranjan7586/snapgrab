export type Platform = "instagram" | "facebook" | "youtube";

export type MediaKind = "video" | "image" | "audio";

/** One downloadable option shown to the user (a specific quality/format). */
export interface MediaFormat {
  /** Stable id from yt-dlp, e.g. "22" or "http-720p" */
  formatId: string;
  /** File extension, e.g. "mp4", "jpg", "m4a" */
  ext: string;
  /** Human label shown in the UI, e.g. "720p", "1080p (no audio)", "Audio only" */
  label: string;
  /** Approximate file size in bytes, if known */
  filesizeBytes: number | null;
  /** Width/height when known (video/image) */
  width: number | null;
  height: number | null;
  /** The direct, currently-valid media URL yt-dlp resolved */
  url: string;
  kind: MediaKind;
  /** true when the format already has audio+video merged (safe to download directly) */
  hasAudio: boolean;
  /** true when this is a video-only stream that needs to be merged with an
   * audio track server-side before it's downloadable — see routes/downloadMerged.ts */
  needsMerge: boolean;
}

/** A single media item (a post can contain several, e.g. an Instagram carousel). */
export interface MediaItem {
  id: string;
  kind: MediaKind;
  thumbnail: string | null;
  durationSeconds: number | null;
  formats: MediaFormat[];
}

export interface ExtractResult {
  platform: Platform;
  sourceUrl: string;
  title: string | null;
  description: string | null;
  author: string | null;
  authorAvatar: string | null;
  thumbnail: string | null;
  isCarousel: boolean;
  items: MediaItem[];
}

export class ExtractionError extends Error {
  status: number;
  code: string;
  constructor(message: string, status = 422, code = "EXTRACTION_FAILED") {
    super(message);
    this.status = status;
    this.code = code;
  }
}
