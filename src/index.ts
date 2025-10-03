/**
 * ================================================
 *  Main Server Entry (index.ts)
 * ================================================
 * - Loads environment variables
 * - Configures Express middlewares
 * - Mounts API routes
 * - Handles errors & 404 routes
 * - Provides health check endpoint
 * - Gracefully shuts down on SIGINT
 * ================================================
 */

import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();

// Third-party middlewares
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

// Routers
import authRouter from "./routes/auth.routes";
import userRouter from "./routes/user.routes";
import adminRouter from "./routes/admin.routes";

// Custom middlewares & configs
import { errorHandler } from "./middlewares/errorHandler";
import { morganMiddleware } from "./configs/morganMiddleware";
import { logger } from "./configs/logger";
import { config } from "./configs/config";
import { prisma } from "./configs/prisma";
import redisCache from "./configs/redisCache";

// ================================================
// Initialize Express app
// ================================================
const app: Application = express();

// ================================================
// Global Middlewares
// ================================================
app.use(morganMiddleware); // Request logging
app.use(express.json({ limit: "10kb" })); // Parse JSON with size limit
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded payloads
app.use(cookieParser()); // Parse cookies
app.use(cors({ origin: "*", credentials: true })); // CORS (configure origin in prod)
app.use(helmet()); // Security headers

// ================================================
// Health Check Route
// ================================================
app.get("/api/health", (_req: Request, res: Response) => {
  logger.info("Health check endpoint hit");
  res.status(200).json({
    status: "success",
    message: "Server is healthy",
  });
});

// ================================================
// API Routes
// ================================================
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/admin", adminRouter);

// ================================================
// 404 Route Handler
// ================================================
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: "fail",
    message: `Route ${req.originalUrl} not found`,
  });
});

// ================================================
// Global Error Handler
// ================================================
app.use(errorHandler);

// ================================================
// Start Server
// ================================================
const PORT = config.PORT;

const server = app.listen(PORT, () => {
  logger.info(`Server ${process.pid} running in ${config.ENV} mode`);
  logger.info(`Listening on http://localhost:${PORT}`);
});

// ================================================
// Graceful Shutdown
// ================================================
process.on("SIGINT", async () => {
  logger.info("SIGINT: shutting down API gracefully...");
  server.close(async () => {
    await prisma.$disconnect();
    await redisCache.quit();
    logger.info("API cleanup done. Exiting.");
    process.exit(0);
  });
});
