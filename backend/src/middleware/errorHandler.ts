import { NextFunction, Request, Response } from "express";
import { ExtractionError } from "../types";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found" });
}

// Express recognizes this as an error-handling middleware purely by its
// four-argument signature — keep all four params even though `next` is unused.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ExtractionError) {
    res.status(err.status).json({ error: err.message, code: err.code });
    return;
  }
  // eslint-disable-next-line no-console
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Something went wrong on our end.", code: "INTERNAL_ERROR" });
}
