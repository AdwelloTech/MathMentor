import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import bodyParser from "body-parser";

/* ================================
   App / Middleware
================================== */
export function setupMiddleware(app: express.Application) {
  app.use(cors());
  app.use(morgan("dev"));
  app.use(bodyParser.json({ limit: "5mb", strict: true }));
  app.use(bodyParser.text({ type: ["text/*", "application/x-www-form-urlencoded"], limit: "2mb" }));

  // avoid 304/stale bodies in dev
  app.set("etag", false);
  app.use((_req, res, next) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    next();
  });
}

/* ================================
   Error Handler
================================== */
export function setupErrorHandler(app: express.Application) {
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    if (err?.type === "entity.parse.failed") {
      return res.status(400).json({ ok: false, error: "Invalid JSON body" });
    }
    res.status(500).json({ ok: false, error: "Server error" });
  });
}
