import express, { type Request, Response, NextFunction } from "express";
import serverless from "serverless-http";
import { registerRoutes } from "../server/routes";
import { setupSession, registerAuthRoutes } from "../server/auth";
import { seedAdmin } from "../server/seed-admin";

const app = express();

app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: false }));

app.set("trust proxy", 1);

// Security headers
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV });
});

let initialized = false;

async function ensureInitialized() {
  if (initialized) return;
  initialized = true;
  setupSession(app);
  registerAuthRoutes(app);
  await seedAdmin();
  const { createServer } = await import("http");
  const httpServer = createServer(app);
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Error:", err);
    if (!res.headersSent) res.status(status).json({ message });
  });
}

const handler = serverless(app);

export default async function (req: any, res: any) {
  await ensureInitialized();
  return handler(req, res);
}
