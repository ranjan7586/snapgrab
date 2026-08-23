# API Reference

Base URL: whatever `NEXT_PUBLIC_API_URL` / `FRONTEND_URL` point at —
`http://localhost:8080` locally, your Render URL in production. All
responses are JSON unless noted otherwise.

---

## `POST /api/extract`

Resolves a social media link into downloadable media.

**Request body**

```json
{ "url": "https://www.instagram.com/reel/AbCdEfGhIjK/" }
```

| Field | Type   | Required | Notes                                                |
|-------|--------|----------|-------------------------------------------------------|
| `url` | string | yes      | Must be a valid URL on an instagram/facebook/youtube host |

**Success response — `200`**

```jsonc
{
  "platform": "instagram",
  "sourceUrl": "https://www.instagram.com/reel/AbCdEfGhIjK/",
  "title": "Caption text or null",
  "description": "Longer description, or null",
  "author": "username or channel name, or null",
  "authorAvatar": null,
  "thumbnail": "https://.../thumb.jpg",
  "isCarousel": false,
  "cached": false,
  "items": [
    {
      "id": "AbCdEfGhIjK",
      "kind": "video",
      "thumbnail": "https://.../thumb.jpg",
      "durationSeconds": 14.3,
      "formats": [
        {
          "formatId": "22",
          "ext": "mp4",
          "label": "720p",
          "filesizeBytes": 4821932,
          "width": 720,
          "height": 1280,
          "url": "https://<resolved-cdn-url>",
          "kind": "video",
          "hasAudio": true,
          "needsMerge": false
        },
        {
          "formatId": "137",
          "ext": "mp4",
          "label": "1080p",
          "filesizeBytes": 18230441,
          "width": 1080,
          "height": 1920,
          "url": "https://<resolved-cdn-url>",
          "kind": "video",
          "hasAudio": false,
          "needsMerge": true
        },
        {
          "formatId": "251",
          "ext": "m4a",
          "label": "Audio (M4A)",
          "filesizeBytes": 210044,
          "width": null,
          "height": null,
          "url": "https://<resolved-cdn-url>",
          "kind": "audio",
          "hasAudio": true,
          "needsMerge": false
        }
      ]
    }
  ]
}
```

`items` has more than one entry only when `isCarousel` is `true` (an
Instagram carousel post with multiple photos/videos). Each item's `url`
fields inside `formats` are **resolved, often short-lived CDN URLs** — treat
them as internal plumbing. The frontend never links to them directly; it
routes each format through one of the two download endpoints below, chosen
by that format's `needsMerge` flag:

- `needsMerge: false` → `GET /api/download` (plain proxy, has this format's `url` already)
- `needsMerge: true` → `GET /api/download-merged` (needs `sourceUrl` + `formatId` instead — see below)

**Error responses**

All errors share this shape:

```json
{ "error": "Human-readable message safe to show the user", "code": "SOME_CODE" }
```

| HTTP status | `code`                | When                                                             |
|-------------|------------------------|-------------------------------------------------------------------|
| 400         | `INVALID_BODY`         | Missing/malformed `url` in the request body                      |
| 400         | `UNSUPPORTED_PLATFORM` | URL isn't on an Instagram/Facebook/YouTube host                  |
| 400         | `PLAYLIST_TOO_LARGE`   | Link resolves to a whole channel/playlist, not a single post     |
| 422         | `EXTRACTION_FAILED`    | Generic extraction failure                                       |
| 422         | `YTDLP_ERROR`          | yt-dlp itself errored (private post, deleted, age-restricted, …) |
| 422         | `NO_MEDIA_FOUND`       | yt-dlp succeeded but returned nothing downloadable                |
| 429         | `RATE_LIMITED`         | Too many requests from this IP — see `RATE_LIMIT_*` env vars      |
| 500         | `YTDLP_MISSING`        | `yt-dlp` binary isn't installed/reachable on the server            |
| 502         | `PARSE_ERROR`          | Couldn't parse yt-dlp's output                                    |
| 504         | `TIMEOUT`              | Extraction took longer than the internal timeout (25s)            |

---

## `GET /api/download`

Streams a single resolved media file back through the backend, with a clean
filename, instead of sending the browser to a third-party CDN URL directly.

**Query parameters**

| Param      | Required | Notes                                                            |
|------------|----------|--------------------------------------------------------------------|
| `url`      | yes      | One of the resolved `formats[].url` values from `/api/extract`   |
| `filename` | no       | Desired filename (extension inferred from content-type if omitted) |

**Response**

The raw file bytes, with:

- `Content-Disposition: attachment; filename="..."`
- `Content-Type` passed through from the upstream CDN response
- `Content-Length` when the upstream provides it

Used both for the actual download buttons **and** for `<video>`/`<img>`
preview `src` attributes in the UI — browsers still render media inline from
an element's `src` regardless of `Content-Disposition`, so one endpoint
serves both purposes.

**Errors** follow the same `{ error, code }` shape as above; the most common
is `INVALID_QUERY` (400) when `url` is missing or malformed.

---

## `GET /api/download-merged`

For a format with `needsMerge: true` — a video-only stream with no audio
track, most commonly YouTube 1080p and above. Re-runs yt-dlp against the
*original post URL* (not a resolved CDN URL) with a `<formatId>+bestaudio`
format selector, lets it download both streams and mux them with ffmpeg into
one mp4, then streams the finished file back and deletes the temp copy.

**Query parameters**

| Param        | Required | Notes                                                              |
|--------------|----------|----------------------------------------------------------------------|
| `sourceUrl`  | yes      | The original pasted link — `ExtractResult.sourceUrl` from `/api/extract`, **not** a `formats[].url` |
| `formatId`   | yes      | The `formatId` of the `needsMerge: true` format to download. Validated against `^[a-zA-Z0-9_.\-]+$` before use |
| `filename`   | no       | Desired filename; `.mp4` is appended if missing                     |

**Response**

Same shape as `/api/download` (`Content-Disposition: attachment`), but
expect it to take noticeably longer to start — the file has to be fully
downloaded and muxed server-side before the first byte can be sent. The
frontend shows a "Preparing your file…" state for this reason (see
`QualityButton.tsx`).

The file is an `.mkv` by default (`Content-Type: video/x-matroska`), not
`.mp4` — see `docs/ARCHITECTURE.md` for why mp4 specifically was dropped as
the default (it can silently produce a black-screen-with-audio file for
fragmented/DASH sources). Set `MERGE_CONTAINER=mp4` server-side if you want
to try mp4 output instead; the response's `Content-Type` and filename
extension always match whatever the backend actually produced.

**Errors**

| HTTP status | `code`                | When                                                            |
|-------------|-------------------------|--------------------------------------------------------------------|
| 400         | `INVALID_QUERY`        | Missing/malformed `sourceUrl` or `formatId`                       |
| 400         | `UNSUPPORTED_PLATFORM` | `sourceUrl` isn't on an Instagram/Facebook/YouTube host            |
| 400         | `INVALID_FORMAT_ID`    | `formatId` contains characters outside the allowlist               |
| 422         | `MERGE_FAILED`         | yt-dlp/ffmpeg failed to produce the merged file — message includes yt-dlp's actual error/warning line |
| 429         | `RATE_LIMITED`         | Too many merge requests from this IP — see `MERGE_RATE_LIMIT_*`    |
| 500         | `YTDLP_MISSING`        | `yt-dlp` binary isn't installed/reachable on the server             |
| 500         | `FFMPEG_MISSING`       | `ffmpeg` binary isn't installed/reachable on the server — checked before yt-dlp even runs, so this fails fast with a clear message instead of a silent audio-less download |
| 504         | `MERGE_TIMEOUT`        | Merge took longer than the internal timeout (120s)                 |

---

## `GET /health`

Liveness check for uptime monitors / your hosting platform's health check.

```json
{ "ok": true, "service": "social-downloader-backend" }
```

No auth, no rate limit, always `200` if the process is up.
