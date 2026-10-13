import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { publicPlatformScript } from "./publicConfig";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { getStripe, processStripeEvent } from "../stripe";
import { COURSE_OFFER, findLesson } from "@shared/course";
import { getResourceForLesson } from "../academyContent";
import * as db from "../db";
import { sdk } from "./sdk";
import path from "node:path";

async function requireAcademyAccess(req: express.Request, res: express.Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    const enrolled = await db.hasActiveAccess(user.id, COURSE_OFFER.slug);
    if (!enrolled) {
      res.status(403).json({ error: "Academy access is required" });
      return false;
    }
    return true;
  } catch {
    res.status(401).json({ error: "Authentication is required" });
    return false;
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Stripe requires the untouched request bytes for signature verification.
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const signature = req.headers["stripe-signature"];
    if (typeof signature !== "string") {
      res.status(400).json({ error: "Missing Stripe signature" });
      return;
    }
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) throw new Error("Stripe webhook is not configured");
      const event = getStripe().webhooks.constructEvent(req.body, signature, webhookSecret);
      await processStripeEvent(event);
      res.status(200).json({ received: true });
    } catch (error) {
      console.error("[Stripe] Webhook processing failed", error instanceof Error ? error.message : error);
      res.status(400).json({ error: "Webhook could not be processed" });
    }
  });

  app.get("/api/academy/video/:lessonId", async (req, res) => {
    if (!findLesson(req.params.lessonId) || !(await requireAcademyAccess(req, res))) return;
    res.set({ "Cache-Control": "private, no-store", "Accept-Ranges": "bytes" });
    res.sendFile(path.join(process.cwd(), "server", "assets", "atelier-nocturne-intro.mp4"));
  });

  app.get("/api/academy/resources/:lessonId", async (req, res) => {
    const resource = getResourceForLesson(req.params.lessonId);
    if (!resource || !findLesson(req.params.lessonId) || !(await requireAcademyAccess(req, res))) return;
    res.set("Cache-Control", "private, no-store");
    res.attachment(resource.filename).type("text/plain; charset=utf-8").send(resource.content);
  });

  // Vite can serve files addressed under the repository during development;
  // course media must only be reachable through the authorized endpoints above.
  app.all("/server/*", (_req, res) => res.status(404).end());

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/platform/config.js", (_req, res) => {
    res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
  });
  registerOAuthRoutes(app);
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

  if (process.env.NODE_ENV === "development") await setupVite(app, server);
  else serveStatic(app);

  const port = Number(process.env.PORT || "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  server.on("error", error => { console.error("Server failed:", error.message); process.exit(1); });
  server.listen(port, "0.0.0.0", () => console.log(`Server listening on port ${port}`));
}

startServer().catch(error => { console.error(error); process.exit(1); });
