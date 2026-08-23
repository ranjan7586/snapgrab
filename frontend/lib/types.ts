// Mirrors backend/src/types.ts — kept as a plain duplicate (no shared
// package) so the frontend has zero build-time dependency on the backend
// repo. If you later move this into a real monorepo, extract a `shared`
// workspace package instead of copy-pasting.

export type Platform = "instagram" | "facebook" | "youtube";
export type MediaKind = "video" | "image" | "audio";

export interface MediaFormat {
  formatId: string;
  ext: string;
  label: string;
  filesizeBytes: number | null;
  width: number | null;
  height: number | null;
  url: string;
  kind: MediaKind;
  hasAudio: boolean;
  /** true when this format needs a server-side merge before it's downloadable — see buildMergedDownloadUrl() in lib/api.ts */
  needsMerge: boolean;
}

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
  cached?: boolean;
}

export interface ApiError {
  error: string;
  code: string;
}
