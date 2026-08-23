import { Router } from "express";
import { createReadStream } from "fs";
import path from "path";
import { z } from "zod";
import { mergeVideoWithAudio, cleanupMergedFile } from "../services/merge";
import { ExtractionError } from "../types";

const CONTENT_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".mkv": "video/x-matroska",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

const router = Router();

const querySchema = z.object({
  sourceUrl: z.string().url(),
  formatId: z.string().min(1).max(64),
  filename: z.string().optional(),
});

/**
 * For qualities that only exist as a video-only stream (typically YouTube
 * 1080p+), this merges in the best available audio track server-side with
 * yt-dlp + ffmpeg before sending anything to the browser. Slower than the
 * plain /api/download proxy (it has to download and mux the whole file
 * first), which is why it's rate-limited separately and has its own
 * generous timeout — see services/merge.ts for the actual work.
 */
router.get("/", async (req, res, next) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    next(new ExtractionError("Missing or invalid parameters.", 400, "INVALID_QUERY"));
    return;
  }
  const { sourceUrl, formatId, filename } = parsed.data;

  let filePath: string | null = null;
  try {
    filePath = await mergeVideoWithAudio(sourceUrl, formatId);

    // merge.ts normalizes the final file to a WhatsApp-compatible MP4. Keep
    // extension detection defensive so the response is never mislabeled if
    // the output strategy changes later.
    const actualExt = path.extname(filePath).toLowerCase() || ".mp4";
    const safeName = (filename || "video").replace(/[^a-zA-Z0-9-_. ]/g, "_").slice(0, 120);
    const baseName = safeName.replace(/\.[a-zA-Z0-9]+$/, "");
    const finalName = `${baseName}${actualExt}`;

    res.setHeader("Content-Disposition", `attachment; filename="${finalName}"`);
    res.setHeader("Content-Type", CONTENT_TYPES[actualExt] || "application/octet-stream");

    const stream = createReadStream(filePath);
    stream.pipe(res);

    const cleanup = () => {
      if (filePath) cleanupMergedFile(filePath);
    };
    stream.on("close", cleanup);
    stream.on("error", cleanup);
    res.on("close", cleanup);
  } catch (err) {
    if (filePath) await cleanupMergedFile(filePath);
    next(err);
  }
});

export default router;
