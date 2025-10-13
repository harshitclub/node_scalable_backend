/**
 * ===========================================================
 *  Main Server Entry (index.ts)
 * ===========================================================
 * - Loads environment variables
 * - Configures Express middlewares
 * - Mounts API routes
 * - Handles errors & 404 routes
 * - Provides health check endpoint
 * - Gracefully shuts down on SIGINT / SIGTERM
 * ===========================================================
 */

import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();

/* ---------------------------------
 * Third-party middlewares
 * --------------------------------- */
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import compression from "compression";
import hpp from "hpp";
import rateLimit from "express-rate-limit";

/* ---------------------------------
 * Routers
 * --------------------------------- */
import authRouter from "./routes/auth.routes";

/* ---------------------------------
 * Custom middlewares & configs
 * --------------------------------- */
import { errorHandler } from "./middlewares/errorHandler";
import { morganMiddleware } from "./configs/morganMiddleware";
import { logger } from "./configs/logger";
import { config } from "./configs/config";
import { prisma } from "./configs/prisma";
import redisCache from "./configs/redisCache";

/* ---------------------------------
 * Initialize Express app
 * --------------------------------- */
const app: Application = express();

/* ---------------------------------
 * Security: small hardening flags
 * --------------------------------- */
// Disable "X-Powered-By" header to prevent tech stack disclosure
app.disable("x-powered-by");

/* ---------------------------------
 * Global Middlewares
 * --------------------------------- */
// HTTP request logging
app.use(morganMiddleware);

// Parse JSON body with size limit
app.use(express.json({ limit: "10kb" }));

// Parse URL-encoded payloads
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Parse cookies from requests
app.use(cookieParser());

// Gzip compression for responses
app.use(compression());

// Protect against HTTP Parameter Pollution attacks
app.use(hpp());

// Secure HTTP headers via Helmet
app.use(helmet());

// CORS configuration (temporary: allow all origins in development)
app.use(cors({ origin: "*", credentials: true }));

/* ---------------------------------
 * Rate Limiting (only for production)
 * --------------------------------- */
if (config.ENV === "production") {
  /**
   * Global Rate Limiter
   * - Restricts excessive requests from a single IP.
   * - Helps prevent brute-force or DDoS-style attacks.
   */
  app.use(
    "/api",
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 300, // limit each IP to 300 requests per window
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        status: "fail",
        message: "Too many requests, please try again later.",
      },
    })
  );

  /**
   * Authentication Rate Limiter
   * - Stricter limit for sensitive routes like login/register.
   */
  app.use(
    "/api/auth",
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // 10 attempts per IP per window
      message: {
        status: "fail",
        message: "Too many login attempts, please try again later.",
      },
    })
  );
}

/* ---------------------------------
 * Health Check Route
 * --------------------------------- */
/**
 * Simple health check endpoint for monitoring or uptime checks.
 * Returns HTTP 200 if the server is healthy.
 */
app.get("/api/health", (_req: Request, res: Response) => {
  logger.info("Health check endpoint hit");
  res.status(200).json({
    status: "success",
    message: "Server is healthy",
  });
});

/* ---------------------------------
 * API Routes
 * --------------------------------- */
app.use("/api/auth", authRouter);

/* ---------------------------------
 * 404 Route Handler
 * --------------------------------- */
/**
 * Handles all unmatched routes and responds with 404.
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: "fail",
    message: `Route ${req.originalUrl} not found`,
  });
});

/* ---------------------------------
 * Global Error Handler
 * --------------------------------- */
/**
 * Centralized error-handling middleware.
 * Catches errors thrown across the app and formats the response.
 */
app.use(errorHandler);

/* ---------------------------------
 * Start Server
 * --------------------------------- */
const PORT = config.PORT;

const server = app.listen(PORT, () => {
  logger.info(`Server ${process.pid} running in ${config.ENV} mode`);
  logger.info(`Listening on http://localhost:${PORT}`);
});

/* ---------------------------------
 * Graceful Shutdown
 * --------------------------------- */
/**
 * Graceful shutdown for controlled process termination.
 * - Closes HTTP server
 * - Disconnects Prisma client
 * - Closes Redis connection
 * - Forces exit after timeout if needed
 */
const gracefulShutdown = async (signal: string) => {
  try {
    logger.warn(`${signal} received - shutting down gracefully...`);

    server.close(async () => {
      try {
        await prisma.$disconnect();
      } catch (error) {
        logger.error("Prisma disconnect error", error);
      }

      try {
        await redisCache.quit();
      } catch (error) {
        logger.error("Redis quit error", error);
      }

      logger.info("Cleanup complete. Exiting.");
      process.exit(0);
    });

    // Force exit if shutdown takes too long
    setTimeout(() => {
      logger.error("Forcing Shutdown after timeout");
      process.exit(0);
    }, 30_000).unref();
  } catch (error) {
    logger.error("Error during shutdown", error);
    process.exit(1);
  }
};

/* ---------------------------------
 * OS Signal Handlers
 * --------------------------------- */
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

/* ---------------------------------
 * Crash-Safe Handlers
 * --------------------------------- */
/**
 * Handle unhandled promise rejections and uncaught exceptions.
 * The process is exited intentionally to avoid unknown corrupted states.
 */
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection at:", reason);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1);
});
