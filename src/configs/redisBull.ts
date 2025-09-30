import IORedis from "ioredis";
import { logger } from "./logger";

const url = process.env.REDIS_BULL_URL || "redis://127.0.0.1:6379/1";

// ioredis instance -- we'll reuse it for Queue/Worker/QueueScheduler
export const bullConnection = new IORedis(url);

bullConnection.on("connect", () =>
  logger.info(`Connected to Redis for BullMQ (${url})`)
);
bullConnection.on("error", (err) =>
  logger.error(`Redis BullMQ Error: ${err.message}`)
);
