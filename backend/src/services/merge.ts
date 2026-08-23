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
const TRANSCODE_TIMEOUT_MS = 180_000;

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

  // Never fall back to an arbitrary prefix match here. When yt-dlp cannot
  // find ffmpeg it can leave separate video/audio fragments behind, and the
  // first directory entry may be the audio fragment. Serving that file as a
  // successful merge is what caused audio-only/black-video downloads.
  const preferred = matches.find((name) => name.endsWith(`.${mergeContainer}`));
  return preferred ? path.join(dir, preferred) : null;
}

/**
 * Normalizes a merged download to the conservative MP4 profile accepted by
 * WhatsApp and other picky mobile apps. An .mp4 extension alone is not
 * enough: yt-dlp may put VP9/AV1 video or HE-AAC/Opus audio in that
 * container, which VLC plays but WhatsApp rejects.
 */
function transcodeToCompatibleMp4(inputFile: string, outputFile: string): Promise<void> {
  const args = [
    "-y",
    "-i",
    inputFile,
    "-map",
    "0:v:0",
    "-map",
    "0:a:0?",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "23",
    "-pix_fmt",
    "yuv420p",
    "-profile:v",
    "main",
    "-level:v",
    "4.1",
    "-c:a",
    "aac",
    "-profile:a",
    "aac_low",
    "-b:a",
    "128k",
    "-ar",
    "48000",
    "-ac",
    "2",
    "-movflags",
    "+faststart",
    outputFile,
  ];

  return new Promise((resolve, reject) => {
    const child = spawn(FFMPEG_PATH, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, TRANSCODE_TIMEOUT_MS);

    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(new ExtractionError(`ffmpeg could not start (${err.message}).`, 500, "FFMPEG_MISSING"));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(new ExtractionError("Converting this video took too long. Try a lower resolution.", 504, "MERGE_TIMEOUT"));
        return;
      }
      if (code !== 0) {
        const lastLine = stderr.split("\n").map((line) => line.trim()).filter(Boolean).pop() || "Unknown ffmpeg error";
        reject(new ExtractionError(`Couldn't convert the video (${lastLine}).`, 422, "MERGE_FAILED"));
        return;
      }
      resolve();
    });
  });
}

/**
 * Downloads a video-only stream + the best available audio track, merges
 * them through yt-dlp/ffmpeg, normalizes the result to H.264 + AAC-LC MP4,
 * and returns the finished file path.
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

  // This controls only the fast intermediate mux. The result is transcoded
  // below, so the client always receives a compatible H.264/AAC-LC MP4.
  // MKV remains the default because it accepts almost any source codecs.
  const mergeContainer = process.env.MERGE_CONTAINER || "mkv";

  const args = [
    "--no-progress",
    "--no-playlist",
    "--socket-timeout",
    "20",
    // checkFfmpegAvailable() uses FFMPEG_PATH, so yt-dlp must use the same
    // configured binary. This is especially important on Windows, where an
    // absolute path in .env does not imply that ffmpeg's directory is on
    // PATH for the child process.
    "--ffmpeg-location",
    FFMPEG_PATH,
    "-f",
    `${formatId}+bestaudio/best`,
    "--merge-output-format",
    mergeContainer,
    "-o",
    outPattern,
    sourceUrl,
  ];

  const mergedFile = await new Promise<string>((resolve, reject) => {
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

  const compatibleFile = `${outBase}-compatible.mp4`;
  try {
    await transcodeToCompatibleMp4(mergedFile, compatibleFile);
    await cleanupMergedFile(mergedFile);
    return compatibleFile;
  } catch (err) {
    await cleanupMergedFile(mergedFile);
    await cleanupMergedFile(compatibleFile);
    throw err;
  }
}

/** Best-effort cleanup — never let a failed delete crash the request. */
export async function cleanupMergedFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    // File may already be gone, or the platform locked it briefly — fine to ignore.
  }
}
