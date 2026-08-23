import type { Platform } from "./types";

const PATTERNS: Record<Platform, RegExp[]> = {
  instagram: [/(^|\.)instagram\.com$/i, /(^|\.)instagr\.am$/i],
  facebook: [/(^|\.)facebook\.com$/i, /(^|\.)fb\.watch$/i, /(^|\.)fb\.com$/i],
  youtube: [/(^|\.)youtube\.com$/i, /(^|\.)youtu\.be$/i, /(^|\.)youtube-nocookie\.com$/i],
};

/** Client-side mirror of the backend's platform detector — used purely to
 * auto-switch the active tab and show the right icon as the user types. The
 * backend re-validates independently, so this never needs to be perfectly
 * in sync for security purposes. */
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

export const PLATFORM_META: Record<
  Platform,
  { label: string; placeholder: string; gradient: string }
> = {
  instagram: {
    label: "Instagram",
    placeholder: "Paste an Instagram Reel, Post, Story or IGTV link…",
    gradient: "from-fuchsia-500 via-pink-500 to-orange-400",
  },
  facebook: {
    label: "Facebook",
    placeholder: "Paste a Facebook video or Watch link…",
    gradient: "from-blue-500 via-blue-600 to-cyan-400",
  },
  youtube: {
    label: "YouTube",
    placeholder: "Paste a YouTube video or Shorts link…",
    gradient: "from-red-500 via-red-600 to-orange-400",
  },
};
