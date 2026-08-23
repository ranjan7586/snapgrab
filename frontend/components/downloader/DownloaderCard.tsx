"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ClipboardPaste, Search } from "lucide-react";
import { PlatformTabs } from "./PlatformTabs";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";
import { ResultPreview } from "./ResultPreview";
import { extractMedia, ApiRequestError } from "@/lib/api";
import { detectPlatform, PLATFORM_META } from "@/lib/platform";
import type { ExtractResult, Platform } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DownloaderCard({ lockedPlatform }: { lockedPlatform?: Platform }) {
  const [platform, setPlatform] = useState<Platform>(lockedPlatform ?? "instagram");
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ExtractResult | null>(null);

  function handleUrlChange(value: string) {
    setUrl(value);
    if (!lockedPlatform) {
      const detected = detectPlatform(value);
      if (detected) setPlatform(detected);
    }
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) handleUrlChange(text.trim());
    } catch {
      // Clipboard permission denied or unavailable — user can still paste manually.
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setStatus("loading");
    setError("");
    setResult(null);

    try {
      const data = await extractMedia(url.trim());
      setResult(data);
      setStatus("success");
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again.";
      setError(message);
      setStatus("error");
    }
  }

  const meta = PLATFORM_META[platform];

  return (
    <div className="w-full max-w-2xl">
      {!lockedPlatform && (
        <div className="mb-5 flex justify-center">
          <PlatformTabs active={platform} onChange={setPlatform} />
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className={cn(
          "glow-ring glass flex flex-col gap-2 rounded-2xl p-2 shadow-2xl transition sm:flex-row sm:items-center",
          "shadow-[var(--shadow-glow)]"
        )}
      >
        <input
          type="url"
          inputMode="url"
          required
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder={meta.placeholder}
          className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none sm:text-base"
        />
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={handlePaste}
            className="flex items-center gap-1.5 rounded-xl border border-surface-border px-3.5 py-3 text-sm font-medium text-muted transition hover:text-foreground"
          >
            <ClipboardPaste size={15} />
            <span className="hidden sm:inline">Paste</span>
          </button>
          <button
            type="submit"
            disabled={status === "loading"}
            className="btn-gradient flex items-center gap-1.5 rounded-xl px-5 py-3 text-sm font-semibold text-white transition disabled:opacity-60"
          >
            <Search size={15} />
            Download
          </button>
        </div>
      </form>

      <AnimatePresence mode="wait">
        {status === "loading" && <LoadingState key="loading" />}
        {status === "error" && <ErrorState key="error" message={error} />}
        {status === "success" && result && <ResultPreview key="result" result={result} />}
      </AnimatePresence>
    </div>
  );
}
