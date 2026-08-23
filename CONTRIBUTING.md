# Contributing / working on this codebase

This is a small two-service project, so the process is intentionally
lightweight. This doc is for whoever picks it up next — including future you.

## Before you touch anything

Read, in this order:

1. `README.md` (root) — setup, deployment, the honest limitations section.
2. `docs/ARCHITECTURE.md` — why it's shaped the way it is, full request flow.
3. `docs/API.md` — exact request/response shapes if you're touching the API.
4. `backend/README.md` or `frontend/README.md` — whichever half you're
   changing, for file-by-file orientation.

## Local setup

```bash
# backend
cd backend && cp .env.example .env && npm install && npm run dev

# frontend, in a second terminal
cd frontend && cp .env.local.example .env.local && npm install && npm run dev
```

You need `yt-dlp` on your PATH (`pip install yt-dlp`) for the backend to
actually extract anything.

## Before opening a PR / calling something done

```bash
# backend
cd backend && npm run typecheck && npm run build

# frontend
cd frontend && npm run lint && npx tsc --noEmit && npm run build
```

All four should be clean. If you touched extraction logic, also manually
test against at least one real link per platform you affected — the
automated checks above don't hit Instagram/Facebook/YouTube.

## Conventions

- **TypeScript everywhere, `strict` mode on.** Don't add `any` to work
  around a type error — fix the type.
- **Comments explain *why*, not *what*.** The code should be readable enough
  that a comment restating it is noise. Reserve comments for non-obvious
  trade-offs (see `ytdlp.ts` and `pickFormats()` for the tone to match).
- **Keep the frontend dumb about extraction.** All yt-dlp-specific logic
  belongs in `backend/src/services/ytdlp.ts`. The frontend should only ever
  need to know about the normalized `ExtractResult` shape.
- **New UI text = new SEO surface.** If you add copy to a platform landing
  page, make sure it's genuinely unique per page — duplicate/thin content
  across `/instagram-video-downloader`, `/facebook-video-downloader`, and
  `/youtube-video-downloader` actively hurts the SEO setup already in place.

## Adding support for a new platform (e.g. TikTok)

1. **Backend:** add the hostname patterns to `PATTERNS` in
   `backend/src/services/platform.ts`, and the new value to the `Platform`
   union in `backend/src/types.ts`.
2. **Sanity-check yt-dlp** against a real link from that site
   (`yt-dlp -j <url>`) — if the JSON shape surprises you, you may need a
   small branch in `pickFormats()` (`backend/src/services/ytdlp.ts`).
3. **Frontend:** mirror the same platform value in `frontend/lib/types.ts`
   and `frontend/lib/platform.ts` (`PATTERNS` + `PLATFORM_META`), add an
   icon to `PlatformTabs.tsx`, and add a new
   `app/<platform>-video-downloader/page.tsx` following the pattern of the
   existing three (unique copy, own FAQ items, `PlatformHero` with
   `platform="tiktok"`).
4. Add the new route to `frontend/app/sitemap.ts`.
5. Run the full check list above before calling it done.

## Reporting a bug

Include: the exact URL you tested with (if it's not sensitive), the full
`{ error, code }` response from `/api/extract` (see `docs/API.md` for what
each code means), and whether it reproduces with a plain `yt-dlp -j <url>`
run outside this project — that tells you immediately whether the bug is in
yt-dlp itself or in this codebase's handling of its output.
