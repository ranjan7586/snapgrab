import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import extractRouter from "./routes/extract";
import downloadRouter from "./routes/download";
import downloadMergedRouter from "./routes/downloadMerged";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { extractLimiter, mergeLimiter } from "./middleware/rateLimiter";

const app = express();
const PORT = Number(process.env.PORT || 8080);

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim());

app.use(helmet());
app.use(morgan("tiny"));
app.use(express.json({ limit: "100kb" }));
app.use(
  cors({
    origin: (origin, callback) => {
      console.log(origin)
      // Allow server-to-server / curl requests with no Origin header, and
      // any origin explicitly listed in FRONTEND_URL.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

app.get("/health", (_req, res) => res.json({ ok: true, service: "social-downloader-backend" }));

app.use("/api/extract", extractLimiter, extractRouter);
app.use("/api/download", downloadRouter);
app.use("/api/download-merged", mergeLimiter, downloadMergedRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`social-downloader-backend listening on :${PORT}`);
});
