import { Router } from "express";
import { z } from "zod";
import { extract } from "../services/ytdlp";
import { getCached, setCached } from "../services/cache";
import { isSupportedUrl } from "../services/platform";
import { ExtractionError } from "../types";

const router = Router();

const bodySchema = z.object({
  url: z.string().trim().url({ message: "That doesn't look like a valid URL." }),
});

router.post("/", async (req, res, next) => {
  try {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ExtractionError(parsed.error.issues[0]?.message || "Invalid request.", 400, "INVALID_BODY");
    }
    const { url } = parsed.data;

    if (!isSupportedUrl(url)) {
      throw new ExtractionError("Unsupported link. Paste an Instagram, Facebook, or YouTube link.", 400, "UNSUPPORTED_PLATFORM");
    }

    const cached = getCached(url);
    if (cached) {
      res.json({ ...cached, cached: true });
      return;
    }

    const result = await extract(url);
    setCached(url, result);
    res.json({ ...result, cached: false });
  } catch (err) {
    next(err);
  }
});

export default router;
