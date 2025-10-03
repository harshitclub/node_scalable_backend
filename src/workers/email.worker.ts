import { Worker } from "bullmq";
import { logger } from "../configs/logger";
import { sendEmail } from "../utils/sendMail";
import { redisBull } from "../configs/redisBull";
import { config } from "../configs/config";

/**
 * @desc   Processor function that runs whenever a job is consumed from the queue
 * @param  job - BullMQ job object (contains job.name and job.data)
 * @logic  Handles different job types (verification email, forgot password email)
 */
const processor = async (job: any) => {
  logger.info(`Processing job: ${job.name}`, { jobId: job.id });

  if (job.name === "verificationEmail") {
    await sendEmail(job.data); // Send verification email
  } else if (job.name === "forgetPasswordEmail") {
    await sendEmail(job.data); // Send forgot password email
  } else {
    logger.warn("Unknown job type", { jobName: job.name });
  }
};

/**
 * @worker emailWorker
 * @queue  emailQueue
 * @desc   Worker that listens to the "emailQueue" and processes jobs using processor()
 * @options
 *  - connection: Redis connection used by the worker
 *  - concurrency: how many jobs can be processed in parallel (default 5)
 */
const emailWorker = new Worker("emailQueue", processor, {
  connection: redisBull,
  concurrency: config.WORKERS.EMAIL_CONCURRENCY || 5,
});

/**
 * @event active
 * @desc  Fired when a job is picked up from the queue and is running
 */
emailWorker.on("active", (job) => {
  logger.info("Job active", { jobId: job.id, name: job.name });
});

/**
 * @event failed
 * @desc  Fired when a job fails after all retry attempts
 */
emailWorker.on("failed", (job, err) => {
  logger.error(`Job ${job?.id} failed`, { error: err.message });
});

/**
 * @event completed
 * @desc  Fired when a job successfully finishes processing
 */
emailWorker.on("completed", (job) => {
  logger.info(`Job completed: ${job.id}`);
});

/**
 * @event error
 * @desc  Fired when the worker itself encounters an error (e.g. Redis disconnect)
 */
emailWorker.on("error", (err) => {
  logger.error("Worker error", { error: err?.message });
});

/**
 * @event drained
 * @desc  Fired when the queue is empty (no more jobs waiting)
 */
emailWorker.on("drained", () => {
  logger.info("Queue drained (no waiting jobs)");
});

/**
 * @signal SIGINT
 * @desc   Handles graceful shutdown when process is killed (CTRL+C or system signal)
 * @logic
 *  - Close worker (stop accepting new jobs, finish current ones)
 *  - Quit Redis connection
 *  - Exit process cleanly
 */
process.on("SIGINT", async () => {
  logger.info("SIGINT: shutting down worker gracefully...");
  await emailWorker.close();
  await redisBull.quit();
  logger.info("Worker cleanup done. Exiting.");
  process.exit(0);
});

export default emailWorker;
