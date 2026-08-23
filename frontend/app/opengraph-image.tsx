import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Snapgrab — Instagram, Facebook & YouTube downloader";

// Next.js's file-convention OG image: generated on demand (and cached at
// build time for static routes) so we don't need to ship a hand-made PNG.
// Drop a file with this same name into any route folder to override the
// image for just that page (e.g. app/instagram-video-downloader/opengraph-image.tsx).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #05050a 0%, #1a0b2e 45%, #05050a 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            padding: "20px 40px",
            borderRadius: 24,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
              background: "linear-gradient(120deg, #a78bfa, #f472b6)",
              color: "white",
            }}
          >
            ⬇
          </div>
          <div style={{ fontSize: 56, fontWeight: 800, color: "white" }}>Snapgrab</div>
        </div>
        <div style={{ marginTop: 28, fontSize: 30, color: "#c7c9d9" }}>
          Download Instagram, Facebook & YouTube videos — free
        </div>
      </div>
    ),
    { ...size }
  );
}
