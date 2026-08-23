import NodeCache from "node-cache";
import { ExtractResult } from "../types";

const ttl = Number(process.env.CACHE_TTL_SECONDS || 300);

// In-memory cache is fine for a single instance. If this ever scales to
// multiple backend instances behind a load balancer, swap this for Redis —
// the interface below is intentionally tiny so that's a one-file change.
const cache = new NodeCache({ stdTTL: ttl, checkperiod: Math.max(30, ttl / 2) });

export function getCached(url: string): ExtractResult | undefined {
  return cache.get<ExtractResult>(url);
}

export function setCached(url: string, result: ExtractResult): void {
  cache.set(url, result);
}
