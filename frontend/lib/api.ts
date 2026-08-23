import type { ApiError, ExtractResult } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export class ApiRequestError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

export async function extractMedia(url: string): Promise<ExtractResult> {
  const res = await fetch(`${API_URL}/api/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  const data = await res.json();

  if (!res.ok) {
    const err = data as ApiError;
    throw new ApiRequestError(err.error || "Something went wrong.", err.code || "UNKNOWN");
  }

  return data as ExtractResult;
}

/** Builds the URL that streams a resolved media file back through our
 * backend proxy (see backend/src/routes/download.ts) with a clean filename. */
export function buildDownloadUrl(mediaUrl: string, filename: string): string {
  const params = new URLSearchParams({ url: mediaUrl, filename });
  return `${API_URL}/api/download?${params.toString()}`;
}

/** Builds the URL for a format whose `needsMerge` flag is true — a
 * video-only stream (typically YouTube 1080p+) that has no audio track of
 * its own. The backend re-runs yt-dlp against the original post URL, merges
 * in the best audio track with ffmpeg, and streams the finished mp4 back.
 * See backend/src/routes/downloadMerged.ts. */
export function buildMergedDownloadUrl(sourceUrl: string, formatId: string, filename: string): string {
  const params = new URLSearchParams({ sourceUrl, formatId, filename });
  return `${API_URL}/api/download-merged?${params.toString()}`;
}
