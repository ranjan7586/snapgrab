import { Router } from "express";
import axios from "axios";
import { z } from "zod";
import { ExtractionError } from "../types";

const router = Router();

const querySchema = z.object({
  url: z.string().url(),
  filename: z.string().optional(),
});

/**
 * Streams the (already-resolved) media URL back through our own server
 * instead of sending the browser straight to Instagram/Facebook/YouTube's
 * CDN. Two reasons this matters:
 *  1. Those CDN links are often locked to the request headers/cookies
 *     yt-dlp used to resolve them, or expire within minutes.
 *  2. We control the Content-Disposition header here, so the browser saves
 *     the file with a clean name instead of a random CDN hash.
 */
router.get("/", async (req, res, next) => {
  try {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ExtractionError("Missing or invalid media URL.", 400, "INVALID_QUERY");
    }
    const { url, filename } = parsed.data;

    const upstream = await axios.get(url, {
      responseType: "stream",
      timeout: 20_000,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SocialDownloader/1.0)" },
      validateStatus: (s) => s < 400,
    });

    const safeName = (filename || "download").replace(/[^a-zA-Z0-9-_. ]/g, "_").slice(0, 120);
    const contentType = String(upstream.headers["content-type"] || "application/octet-stream");
    const contentLength = upstream.headers["content-length"];
    const ext = contentType.includes("video") ? "mp4" : contentType.includes("image") ? "jpg" : "";
    const finalName = safeName.includes(".") ? safeName : ext ? `${safeName}.${ext}` : safeName;

    res.setHeader("Content-Disposition", `attachment; filename="${finalName}"`);
    res.setHeader("Content-Type", contentType);
    if (contentLength) {
      res.setHeader("Content-Length", String(contentLength));
    }

    upstream.data.pipe(res);
    upstream.data.on("error", () => res.destroy());
  } catch (err) {
    next(err);
  }
});

export default router;
