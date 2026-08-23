# Snapgrab — Instagram / Facebook / YouTube Downloader

A two-part project:

```
project/
  frontend/   Next.js 16 (App Router) + TypeScript + Tailwind v4 + Framer Motion
  backend/    Node.js + Express + TypeScript, extraction powered by yt-dlp
  docs/       Deep-dive architecture + full API reference
```

Read this top to bottom once — it explains *why* it's built this way, not just
how to run it, since you're using this to learn.

## Documentation map

If you're onboarding someone else onto this codebase, point them here first:

| Doc | What's in it |
|-----|----------------|
| **This file** | Setup, deployment, SEO, the honest limitations section |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Full request-flow diagram, every design decision explained |
| [`docs/API.md`](docs/API.md) | Every endpoint: request/response shapes, all error codes |
| [`backend/README.md`](backend/README.md) | Backend-specific setup, scripts, project structure |
| [`frontend/README.md`](frontend/README.md) | Frontend-specific quick start |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Conventions, pre-PR checklist, how to add a new platform |

---

## 1. Why two separate apps, not one Next.js app?

Vercel's serverless functions have short execution limits and no persistent
processes. `yt-dlp` — the tool that actually knows how to talk to Instagram,
Facebook, and YouTube's internal APIs — is a real subprocess that needs a
real server, ffmpeg, and sometimes 10-20+ seconds for a slow link. So:

- **`frontend/`** → deployed on **Vercel**. Pure UI, calls the backend over HTTP.
- **`backend/`** → deployed on **Render** (or Railway/Fly) as a Docker
  container with Node + Python + yt-dlp + ffmpeg installed. Does the actual
  extraction and streams the file back to the browser.

This is the same shape almost every real downloader site uses under the hood.

## 2. How extraction actually works

1. User pastes a link → frontend calls `POST {backend}/api/extract { url }`.
2. The backend runs `yt-dlp --dump-json <url>` as a subprocess
   (`backend/src/services/ytdlp.ts`). yt-dlp has built-in "extractors" for
   Instagram, Facebook, and YouTube that know how to reverse-engineer each
   site's internal API and return direct, temporary media URLs plus metadata
   (title, thumbnail, available qualities, etc.) as JSON.
3. The backend parses that JSON into a clean shape (`ExtractResult`) and
   picks a sane set of qualities to show — see `pickFormats()` for the logic.
4. The frontend renders the result card. Most "Download" buttons point at
   `GET {backend}/api/download?url=...&filename=...` — **not** the raw CDN
   URL directly. That route (`backend/src/routes/download.ts`) streams the
   file through our own server so:
   - the browser gets a clean filename via `Content-Disposition`,
   - we're not exposing a raw, session-locked CDN URL that might expire or
     get blocked by hotlink protection.
5. Some qualities — most commonly YouTube 1080p and above — only exist as a
   video-only stream with no audio track attached (YouTube serves those
   separately and expects the client to combine them). Those formats are
   flagged `needsMerge: true` and route through a different endpoint,
   `GET /api/download-merged?sourceUrl=...&formatId=...`, which re-runs
   yt-dlp with `-f "<formatId>+bestaudio"` so it downloads both streams and
   muxes them into one mp4 with ffmpeg before streaming the result back.
   It's slower (the file has to be fully prepared before any bytes reach the
   browser) and rate-limited separately for that reason — see
   `docs/ARCHITECTURE.md` §"Video-only formats" for the full walkthrough.

Because all three platforms are handled by the *same* generic pipeline
(`extract()` → `pickFormats()` → proxy download / merge-download), adding a
fourth platform later mostly means adding it to `detectPlatform()` — yt-dlp
does the rest.

## 3. Local development

**Backend**

```bash
cd backend
cp .env.example .env
npm install
npm run dev          # http://localhost:8080
```

You need `yt-dlp` installed on your machine for `npm run dev` to work:

```bash
pip install yt-dlp   # or: brew install yt-dlp / pipx install yt-dlp
```

**Frontend**

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev           # http://localhost:3000
```

## 4. A note on testing (read this before you panic)

I built and typechecked/linted both apps and ran full production builds for
both — everything compiles cleanly. What I could **not** do from this sandbox
is actually hit instagram.com / youtube.com / facebook.com, because this
cloud environment's outbound network is restricted to an allowlist (npm,
PyPI, GitHub, a handful of others) for security reasons — it 403s any other
domain, Google Fonts included. That's a property of *my* environment, not a
bug in the code.

**Please run the backend locally first** (`npm run dev` + a real Instagram
Reel URL via curl or the frontend) before you deploy, so you catch anything
platform-specific that only shows up against the live site. A good first
test:

```bash
curl -X POST http://localhost:8080/api/extract \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

YouTube is the most reliable extractor to start with. Instagram is the
trickiest in practice — see the honesty section below.

Once `/api/extract` works, specifically test a YouTube video known to have
1080p+ (that response will include a format with `"needsMerge": true`), then
hit `/api/download-merged` with that format's id to confirm ffmpeg merging
works on your machine — that path needs `ffmpeg` installed locally
(`ffmpeg -version` to check; `brew install ffmpeg` / `apt install ffmpeg` /
the Windows build from ffmpeg.org if it's missing). It's already included in
the Docker image used for deployment, so this is purely a local-dev
prerequisite.

## 5. Be honest with yourself about Instagram

yt-dlp's Instagram extractor works well for **public** Reels/posts most of
the time, but Instagram actively fights scraping and increasingly wants a
logged-in session (cookies) to serve full-quality video, especially for
accounts it doesn't fully trust the request from. If you hit
"login required" errors in testing:

- yt-dlp supports `--cookies-from-browser` / a cookies file for authenticated
  requests. You *could* wire this in via `YTDLP_PATH` args in
  `ytdlp.ts` — but think carefully before shipping that publicly: using your
  own logged-in cookies on a public-facing server is a good way to get that
  account flagged or banned.
- The realistic expectation for a portfolio/learning project: it'll work
  great for a large share of public Reels/posts, and occasionally miss ones
  Instagram is actively protecting. Every downloader site you screenshotted
  has this same ceiling — none of them have a magic bypass.

## 6. Deploying

**Backend → Render**
1. Push `backend/` to a GitHub repo (or the `backend` folder of this repo).
2. New → Web Service → connect the repo → Render will detect the
   `Dockerfile` automatically.
3. Set environment variables from `.env.example` (at minimum `FRONTEND_URL`
   to your Vercel domain once you have it).
4. Deploy. Note the resulting URL, e.g. `https://snapgrab-api.onrender.com`.

**Frontend → Vercel**
1. Push `frontend/` to GitHub.
2. Import into Vercel (framework auto-detected as Next.js).
3. Environment variables:
   - `NEXT_PUBLIC_API_URL` = your Render backend URL
   - `NEXT_PUBLIC_SITE_URL` = your final Vercel/custom domain
4. Deploy. Go back to Render and set `FRONTEND_URL` to this exact URL so CORS
   allows it.

## 7. SEO — what's already wired up, and what you still do by hand

Already in the code (`frontend/lib/seo.ts` + the `app/` file conventions):

- Per-page `<title>` / meta description / canonical URL / Open Graph /
  Twitter card, via `pageSeo()` — every route calls this with unique copy.
- Dedicated, keyword-targeted landing pages with real unique paragraphs
  (not thin/duplicate content): `/instagram-video-downloader`,
  `/facebook-video-downloader`, `/youtube-video-downloader`.
- `sitemap.xml` and `robots.txt` generated from `app/sitemap.ts` /
  `app/robots.ts`.
- `WebSite`, `Organization`, `WebApplication`, and `FAQPage` JSON-LD
  structured data (helps you qualify for rich results/FAQ snippets).
- A dynamically generated Open Graph image (`app/opengraph-image.tsx`) so
  social shares look good with zero manual asset work.

Still on you, after deploying:

- Set `NEXT_PUBLIC_SITE_URL` to your real domain (this drives every
  canonical URL, the sitemap, and JSON-LD — get it right first).
- Submit the sitemap in Google Search Console once you have a real domain.
- Real backlinks and content depth (blog posts, comparisons, etc.) still
  matter more than any on-page trick — the on-page half is done for you.

## 8. Legal / ethical note (mentor hat on)

Downloading video from these platforms sits in a gray area of their Terms of
Service almost everywhere — every site you sent me screenshots of has the
same exposure. Treat this as a learning project and a personal tool first.
If you ever plan to run it at real scale for other people, get comfortable
with: rate limiting per IP (already stubbed in), a clear "for personal use /
content you own or have permission to use" disclaimer (already in the
footer), and expect occasional takedown requests — it comes with the
territory for this category of tool.

## 9. Where to go next (exercises, if you want to actually learn this)

1. Add a loading skeleton that mimics the final card's shape instead of a
   spinner (better perceived performance).
2. Add Range-request support to `download.ts` so the `<video>` scrubber can
   seek without re-downloading from the start.
3. Swap the in-memory cache (`backend/src/services/cache.ts`) for Redis and
   deploy two backend instances behind a load balancer.
4. Add a "quality auto-pick" default (highest progressive stream) with an
   "advanced" toggle to reveal the full list.
5. Wire up `--cookies-from-browser` behind a feature flag, purely to see how
   much it changes Instagram's success rate in your own local testing
   (not for production use — see §5).
