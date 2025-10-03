import { Queue } from "bullmq";
import { redisBull } from "../configs/redisBull";

/**
 * @queue  emailQueue
 * @desc   Queue for handling all email-related jobs (e.g. verification, forgot password)
 * @connection Uses a dedicated Redis connection (redisBull)
 * @defaultJobOptions
 *  - attempts: Number of retries if job fails (default: 3)
 *  - backoff: Delay strategy between retries (exponential, starts at 5s)
 *  - removeOnComplete: Automatically remove successful jobs from Redis after 1 hour
 *  - removeOnFail: Keep failed jobs in Redis for debugging (false = do not remove)
 *
 * @example
 * // Add a new job to the emailQueue
 * await emailQueue.add("verificationEmail", {
 *   to: "user@example.com",
 *   subject: "Verify your email",
 *   html: "<p>Click the link...</p>"
 * });
 */
const emailQueue = new Queue("emailQueue", {
  connection: redisBull,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000, // 5 seconds base delay
    },
    removeOnComplete: { age: 3600 }, // cleanup finished jobs after 1 hour
    removeOnFail: false, // keep failed jobs for debugging
  },
});

export default emailQueue;
