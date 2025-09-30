import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes";
import userRouter from "./routes/user.routes";
import adminRouter from "./routes/admin.routes";
import { errorHandler } from "./middlewares/errorHandler";
import { morganMiddleware } from "./configs/morganMiddleware";
import { logger } from "./configs/logger";
import { config } from "./configs/config";
import { prisma } from "./configs/prisma";

// Initialize express app
const app: Application = express();

// Middlewares
app.use(morganMiddleware); // Logging
app.use(express.json({ limit: "10kb" })); // Parse JSON
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded
app.use(cookieParser());
app.use(cors({ origin: "*", credentials: true })); // Can configure origin later
app.use(helmet()); // Security headers

// Health check route
app.get("/api/health", (_req: Request, res: Response) => {
  logger.info("Health check endpoint hit"); // info log
  res.status(200).json({
    status: "Success",
    message: "Server is healthy",
  });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/admin", adminRouter);

// 404 route handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: "fail",
    message: `Route ${req.originalUrl} not found`,
  });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = config.PORT;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running in ${config.ENV} mode`);
  logger.info(`📡 Listening on http://localhost:${PORT}`);
});

process.on("SIGINT", async () => {
  logger.info(`Received SIGINT. Shutting down gracefully...`);
  server.close(async () => {
    ``;
    await prisma.$disconnect();
    logger.info("Cleanup done. Exiting.");
    process.exit();
  });
});
