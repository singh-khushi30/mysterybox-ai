import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "MysteryBox API is running",
  });
});

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
