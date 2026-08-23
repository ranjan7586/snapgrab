import { spawn } from "child_process";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { detectPlatform } from "./platform";
import { ExtractionError } from "../types";

const YTDLP_PATH = process.env.YTDLP_PATH || "yt-dlp";
const FFMPEG_PATH = process.env.FFMPEG_PATH || "ffmpeg";
// Downloading + muxing takes a lot longer than just reading metadata, so
// this gets a much longer budget than the plain extract() timeout.
const MERGE_TIMEOUT_MS = 120_000;

// Only safe characters yt-dlp format ids ever actually contain (e.g. "137",
// "hls-1080", "dash-1460705421972380v"). Rejecting anything else means a
// crafted formatId can never smuggle extra flags into the -f selector string.
const SAFE_FORMAT_ID = /^[a-zA-Z0-9_.\-]+$/;

// Checked lazily on the first merge request rather than at server startup,
// so a backend that's only ever used for progressive-format downloads never
// pays this cost. Cached for the life of the process — ffmpeg presence
// doesn't change at runtime.
let ffmpegAvailable: boolean | null = null;

function checkFfmpegAvailable(): Promise<boolean> {
  if (ffmpegAvailable !== null) return Promise.resolve(ffmpegAvailable);
  return new Promise((resolve) => {
    const child = spawn(FFMPEG_PATH, ["-version"], { stdio: "ignore" });
    child.on("error", () => {
      ffmpegAvailable = false;
      resolve(false);
    });
    child.on("close", (code) => {
      ffmpegAvailable = code === 0;
      resolve(ffmpegAvailable);
    });
  });
}

/** Finds whatever file yt-dlp actually produced for a given output base. We
 * search by prefix instead of assuming "<base>.<mergeContainer>" so a
 * container mismatch shows up as a wrong-but-present file we can still
 * serve, rather than a confusing "file not found".
 *
 * yt-dlp normally cleans up the separate video/audio temp files it
 * downloads before merging, leaving only the final merged file — but if
 * anything interrupts that cleanup, more than one file could share this
 * prefix. Preferring the expected container extension (mergeContainer)
 * avoids accidentally serving a leftover audio-only or video-only fragment
 * instead of the actual merged result. */
async function findOutputFile(outBase: string, mergeContainer: string): Promise<string | null> {
  const dir = path.dirname(outBase);
  const prefix = path.basename(outBase);
  const entries = await fs.readdir(dir).catch(() => [] as string[]);
  const matches = entries.filter((name) => name.startsWith(prefix));
  if (matches.length === 0) return null;

  const preferred = matches.find((name) => name.endsWith(`.${mergeContainer}`));
  return path.join(dir, preferred ?? matches[0]);
}

/**
 * Downloads a video-only stream + the best available audio track for the
 * same post, merges them into a single mp4 with ffmpeg (via yt-dlp's
 * built-in --merge-output-format), and returns the path to the finished
 * file on disk.
 *
 * Why re-run yt-dlp instead of reusing the URLs from /api/extract? Two
 * reasons: (1) those resolved CDN URLs can expire within minutes, so
 * re-resolving right before download is actually safer, and (2) merging
 * needs yt-dlp + ffmpeg working together as a pipeline, which only happens
 * when yt-dlp itself drives the download — we can't do it by proxying two
 * plain HTTP streams ourselves.
 *
 * The caller (routes/downloadMerged.ts) is responsible for streaming the
 * returned file to the response and then deleting it — see
 * cleanupMergedFile().
 */
export async function mergeVideoWithAudio(sourceUrl: string, formatId: string): Promise<string> {
  if (!detectPlatform(sourceUrl)) {
    throw new ExtractionError("Unsupported link.", 400, "UNSUPPORTED_PLATFORM");
  }
  if (!SAFE_FORMAT_ID.test(formatId)) {
    throw new ExtractionError("Invalid format id.", 400, "INVALID_FORMAT_ID");
  }

  // Fail fast with a clear message instead of letting yt-dlp merge silently
  // fall back to a non-merged (audio-less) file when ffmpeg is missing —
  // that used to surface as an opaque "Unknown error" because yt-dlp logs
  // the real reason as a WARNING, which is easy to lose track of.
  if (!(await checkFfmpegAvailable())) {
    throw new ExtractionError(
      "This quality needs ffmpeg on the server to combine video and audio, and it isn't installed (or isn't on PATH). Run `ffmpeg -version` to check, install it, then restart the backend — see backend/README.md.",
      500,
      "FFMPEG_MISSING"
    );
  }

  const outBase = path.join(os.tmpdir(), `snapgrab-merge-${randomUUID()}`);
  const outPattern = `${outBase}.%(ext)s`;

  // mkv, not mp4, is the merge container on purpose. ffmpeg merges video+
  // audio by remuxing (no re-encoding) for speed, and mp4 is picky about
  // what it'll accept without a re-encode — a fragmented/DASH-sourced video
  // track (exactly what we're merging here) muxed into mp4 without
  // re-encoding is a well-known way to end up with a file that plays audio
  // over a black screen in some players, even though the video data is
  // technically all there. mkv accepts virtually any codec combination
  // as-is, which is also why it's yt-dlp's own default merge container.
  // Downstream code (downloadMerged.ts) already picks up whatever extension
  // the resulting file actually has, so this isn't hardcoded anywhere else.
  // Override with MERGE_CONTAINER=mp4 if you'd rather trade reliability for
  // slightly broader default-player compatibility.
  const mergeContainer = process.env.MERGE_CONTAINER || "mkv";

  const args = [
    "--no-progress",
    "--no-playlist",
    "--socket-timeout",
    "20",
    "-f",
    `${formatId}+bestaudio/best`,
    "--merge-output-format",
    mergeContainer,
    "-o",
    outPattern,
    sourceUrl,
  ];

  return await new Promise<string>((resolve, reject) => {
    const child = spawn(YTDLP_PATH, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new ExtractionError("Preparing that quality took too long. Try a lower resolution.", 504, "MERGE_TIMEOUT"));
    }, MERGE_TIMEOUT_MS);

    child.stderr.on("data", (chunk) => (stderr += chunk));

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(new ExtractionError(`yt-dlp is not available on this server (${err.message}).`, 500, "YTDLP_MISSING"));
    });

    child.on("close", async (code) => {
      clearTimeout(timer);
      const outputFile = await findOutputFile(outBase, mergeContainer);

      if (code !== 0 || !outputFile) {
        const lastLine = stderr.split("\n").map((l) => l.trim()).filter(Boolean).pop();
        const reason = lastLine
          ? lastLine.replace(/^(ERROR|WARNING):\s*/i, "")
          : "yt-dlp exited without producing a file — the post may have changed or that quality is no longer available. Try re-pasting the link.";
        reject(new ExtractionError(`Couldn't prepare that quality (${reason}).`, 422, "MERGE_FAILED"));
        return;
      }
      resolve(outputFile);
    });
  });
}

/** Best-effort cleanup — never let a failed delete crash the request. */
export async function cleanupMergedFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    // File may already be gone, or the platform locked it briefly — fine to ignore.
  }
}
