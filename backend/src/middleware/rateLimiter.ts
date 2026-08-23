import rateLimit from "express-rate-limit";

export const extractLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
  limit: Number(process.env.RATE_LIMIT_MAX || 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait a moment and try again.", code: "RATE_LIMITED" },
});

// Merging video+audio spins up a second yt-dlp process plus ffmpeg and
// writes a real file to disk, so it's meaningfully more expensive per
// request than a plain extract/proxy call — keep its own, stricter cap.
export const mergeLimiter = rateLimit({
  windowMs: Number(process.env.MERGE_RATE_LIMIT_WINDOW_MS || 60_000),
  limit: Number(process.env.MERGE_RATE_LIMIT_MAX || 6),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many HD downloads at once. Please wait a moment and try again.", code: "RATE_LIMITED" },
});
