import { createClient } from "redis";
import { logger } from "./logger";

const url = process.env.REDIS_CACHE_URL || "redis://127.0.0.1:6379/0";

export const cacheClient = createClient({ url });

cacheClient.on("error", (err) =>
  logger.error(`Redis Cache Error: ${err.message}`)
);

cacheClient
  .connect()
  .then(() => logger.info(`Connected to Redis cache (${url})`))
  .catch((err) => logger.error(`Redis cache connect failed: ${err.message}`));
