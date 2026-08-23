import { Platform } from "../types";

const PATTERNS: Record<Platform, RegExp[]> = {
  instagram: [/(^|\.)instagram\.com$/i, /(^|\.)instagr\.am$/i],
  facebook: [/(^|\.)facebook\.com$/i, /(^|\.)fb\.watch$/i, /(^|\.)fb\.com$/i],
  youtube: [/(^|\.)youtube\.com$/i, /(^|\.)youtu\.be$/i, /(^|\.)youtube-nocookie\.com$/i],
};

/**
 * Figures out which of the three platforms a pasted URL belongs to, purely
 * from its hostname. Returns null for anything we don't support, so the
 * caller can reject it before it ever reaches yt-dlp.
 */
export function detectPlatform(rawUrl: string): Platform | null {
  let host: string;
  try {
    host = new URL(rawUrl).hostname;
  } catch {
    return null;
  }

  for (const [platform, patterns] of Object.entries(PATTERNS) as [Platform, RegExp[]][]) {
    if (patterns.some((re) => re.test(host))) return platform;
  }
  return null;
}

export function isSupportedUrl(rawUrl: string): boolean {
  return detectPlatform(rawUrl) !== null;
}
