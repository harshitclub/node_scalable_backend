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

// Initialize express app
const app: Application = express();

// Middlewares
app.use(morganMiddleware); // Logging
app.use(express.json({ limit: "10kb" })); // Parse JSON
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded
app.use(cookieParser());
app.use(cors({ origin: "*", credentials: true })); // Can configure origin later
app.use(helmet()); // Security headers

// Error handler (last middleware)
app.use(errorHandler);

// Health check route
app.get("/api/health", (_req: Request, res: Response) => {
  logger.info("Health check endpoint hit"); // info log
  res.status(200).json({
    status: "Sucess",
    message: "Server is healthy",
  });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/admin", adminRouter);

// Start server
const PORT = config.PORT;

app.listen(PORT, () => {
  console.log(`Sever running on http://localhost:${PORT}`);
});
