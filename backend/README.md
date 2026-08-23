# Snapgrab — backend

Node.js + Express + TypeScript. This service does the actual extraction work
— talking to `yt-dlp`, shaping its output, and streaming files back to the
browser. The frontend (`../frontend`) is a thin client on top of this API.

For the big-picture "why does this exist as a separate service" explanation,
see `../docs/ARCHITECTURE.md`. This file is the practical, in-the-weeds
reference for working on the backend itself.

## Setup

```bash
cp .env.example .env
npm install
npm run dev        # http://localhost:8080, auto-reloads on save
```

You need the `yt-dlp` binary on your PATH for extraction to work locally:

```bash
pip install yt-dlp
# or: brew install yt-dlp / pipx install yt-dlp
yt-dlp --version    # sanity check
```

`ffmpeg` is also required locally: any format flagged `needsMerge: true`
(most commonly YouTube 1080p+) is downloaded and muxed with ffmpeg on
`/api/download-merged` — see `docs/ARCHITECTURE.md` §"Video-only formats"
for how that works. `ffmpeg -version` to check you have it;
`brew install ffmpeg` / `apt install ffmpeg` / the ffmpeg.org build on
Windows if not. It's already baked into the Docker image used for
deployment, so this only matters for local dev.

## Scripts

| Command            | What it does                                      |
|---------------------|----------------------------------------------------|
| `npm run dev`       | Runs the TS source directly with nodemon + ts-node |
| `npm run build`     | Compiles `src/` → `dist/` with `tsc`               |
| `npm start`         | Runs the compiled `dist/index.js` (production)     |
| `npm run typecheck` | Type-checks without emitting files                 |

## Environment variables

See `.env.example` for the full list with comments. The ones you'll actually
touch per-environment:

| Variable       | Purpose                                                        |
|-----------------|------------------------------------------------------------------|
| `PORT`          | Port Express listens on                                        |
| `FRONTEND_URL`  | Comma-separated list of origins allowed by CORS                |
| `YTDLP_PATH`    | Path/command for the yt-dlp binary (usually just `"yt-dlp"`)   |
| `FFMPEG_PATH`   | Path/command for ffmpeg (usually just `"ffmpeg"`), used by `/api/download-merged` |
| `MERGE_CONTAINER` | Container for merged video+audio, default `mkv` (avoids a black-screen-with-audio issue mp4 can hit on fragmented sources — see `docs/ARCHITECTURE.md`) |
| `CACHE_TTL_SECONDS` | How long an extraction result is cached in memory per URL  |
| `RATE_LIMIT_*`  | Basic per-IP throttling on `/api/extract`                       |
| `MERGE_RATE_LIMIT_*` | Stricter per-IP throttling on `/api/download-merged` (more expensive per request) |

## Project structure

```
src/
  index.ts               Express app wiring: middleware, routes, startup
  types.ts                Shared TS types (ExtractResult, MediaFormat, …)
  services/
    platform.ts            URL → "instagram" | "facebook" | "youtube" | null
    ytdlp.ts                Spawns yt-dlp, parses its JSON into ExtractResult
    cache.ts                In-memory cache keyed by source URL
    merge.ts                 Re-runs yt-dlp + ffmpeg to mux video-only + audio, for needsMerge formats
  routes/
    extract.ts              POST /api/extract
    download.ts              GET /api/download (streaming proxy)
    downloadMerged.ts         GET /api/download-merged (merge, stream, cleanup temp file)
  middleware/
    errorHandler.ts          Central error → HTTP response mapping
    rateLimiter.ts            express-rate-limit config (extract + a stricter one for merges)
```

If you're new to the codebase, read them in that order — `ytdlp.ts` is the
one file worth reading slowly, since every design decision in the API
reference traces back to how it parses yt-dlp's output.

## API endpoints

Full request/response shapes and error codes live in `../docs/API.md`. Quick
summary:

- `POST /api/extract` — body `{ "url": "..." }`, returns an `ExtractResult`
  (title, thumbnail, author, and one or more `items`, each with a list of
  downloadable `formats`).
- `GET /api/download?url=...&filename=...` — streams a single resolved media
  URL back through this server with a clean `Content-Disposition` filename.
- `GET /api/download-merged?sourceUrl=...&formatId=...&filename=...` — for
  formats with no audio track of their own (`needsMerge: true`): re-runs
  yt-dlp against `sourceUrl` with `-f "<formatId>+bestaudio"`, muxes the
  result with ffmpeg, streams the finished file, then deletes the temp copy.
  Slower and more rate-limited than plain `/api/download`.
- `GET /health` — liveness check, returns `{ ok: true }`.

## Adding a fourth platform

Because `yt-dlp` already has an extractor for hundreds of sites, adding one
(say, TikTok) is mostly wiring, not new extraction logic:

1. Add its hostnames to `PATTERNS` in `services/platform.ts` and to the
   `Platform` union in `types.ts`.
2. Confirm `yt-dlp <url> -j` returns something sane for a real link from that
   site — if the JSON shape is very different from IG/FB/YT, you may need a
   small branch in `pickFormats()`.
3. Mirror the pattern on the frontend: `lib/platform.ts`,
   `lib/types.ts`, a new `/x-video-downloader` page, and an entry in
   `PlatformTabs.tsx`.

See `../CONTRIBUTING.md` for the full checklist.

## Deploying

This service ships as a Docker image (`Dockerfile` in this folder) because
`yt-dlp` needs Python + pip + ffmpeg alongside Node — a plain Node buildpack
won't have those. Render, Railway, and Fly.io all build from this Dockerfile
with zero extra config. See `../README.md` §6 for the step-by-step.
