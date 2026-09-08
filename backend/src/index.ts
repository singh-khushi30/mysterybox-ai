import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { supabase } from "./config/supabase.js";
import { errorHandler } from "./middleware/error.js";
import { apiRouter } from "./routes/index.js";
import { fail } from "./utils/http.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 5000;
const allowedOrigins = (process.env.FRONTEND_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors(allowedOrigins.length > 0 ? { origin: allowedOrigins } : undefined));
app.use(morgan("dev"));
app.use(express.json({ limit: "64kb" }));

const VERCEL_BACKEND_PREFIX = "/api/backend";
app.use((req, _res, next) => {
  const url = req.url;
  if (
    url === VERCEL_BACKEND_PREFIX ||
    url.startsWith(`${VERCEL_BACKEND_PREFIX}/`) ||
    url.startsWith(`${VERCEL_BACKEND_PREFIX}?`)
  ) {
    const stripped = url.slice(VERCEL_BACKEND_PREFIX.length);
    req.url = stripped.startsWith("/") || stripped.startsWith("?") ? stripped : `/${stripped}`;
    if (req.url === "" || req.url.startsWith("?")) {
      req.url = `/${req.url}`;
    }
  }
  next();
});

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "MysteryBox API is running",
    health: "/api/health",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "MysteryBox API is running",
  });
});

app.get("/api/db-status", async (_req, res) => {
  try {
    const { error } = await supabase
      .from("_connection_check")
      .select("*")
      .limit(1);

    if (error && !isSupabaseReachable(error.code, error.message)) {
      console.error("Supabase connection check failed.");
      res.status(503).json({
        success: false,
        database: "disconnected",
      });
      return;
    }

    res.json({
      success: true,
      database: "connected",
    });
  } catch {
    console.error("Supabase connection check failed.");
    res.status(503).json({
      success: false,
      database: "disconnected",
    });
  }
});

app.use("/api", apiRouter);

app.use("/api", (_req, res) => {
  res.status(404).json(fail("Not found"));
});

app.use(errorHandler);

function isSupabaseReachable(code: string | undefined, message: string): boolean {
  if (code === "PGRST205" || code === "PGRST116" || code === "42P01") {
    return true;
  }

  return /could not find the table|does not exist|schema cache/i.test(message);
}

const server = app.listen(port, () => {
  console.log(`MysteryBox API listening on http://localhost:${port}`);
});

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use.`);
    if (port === 5000) {
      console.error(
        "On macOS, port 5000 is often taken by AirPlay Receiver. Turn it off in System Settings → General → AirDrop & Handoff, or start with PORT=5050 npm run dev."
      );
    }
    process.exit(1);
  }

  throw error;
});
