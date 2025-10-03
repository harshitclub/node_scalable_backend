import Redis from "ioredis";
import { config } from "./config";
import { logger } from "./logger";

/**
 * @client redisBull
 * @desc   Redis client dedicated for BullMQ (queues & workers)
 * @why
 *   - Keep separate from `redisCache` because:
 *     1. BullMQ jobs can be high-volume and need isolation.
 *     2. Prevents mixing queue data with app-level caching.
 *   - Uses REDIS_BULL_URL from environment variables.
 *
 * @options
 *  - maxRetriesPerRequest: null
 *    → Required by BullMQ. Disables ioredis auto-retries (BullMQ handles retries itself).
 *
 *  - enableReadyCheck: false
 *    → Skips Redis "ready check" for faster worker startup (not needed by BullMQ).
 *
 * @example
 * // Used in workers and queues
 * import { redisBull } from "../configs/redisBull";
 * const emailQueue = new Queue("emailQueue", { connection: redisBull });
 */
export const redisBull = new Redis(config.REDIS.BULL_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

/**
 * @event connect
 * @desc  Fired when Redis successfully connects (BullMQ can start consuming jobs)
 */
redisBull.on("connect", () => {
  logger.info("Redis (BullMQ) connected:", config.REDIS.BULL_URL);
});

/**
 * @event error
 * @desc  Fired when there is any Redis connection/command error for BullMQ
 */
redisBull.on("error", (err) => {
  logger.error("Redis (BullMQ) error:", err.message);
});
