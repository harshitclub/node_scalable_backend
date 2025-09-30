import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { logger } from "./logger";
import { config } from "./config";

dotenv.config();

// Create a transport
export const transporter = nodemailer.createTransport({
  host: config.SMTP.HOST,
  port: config.SMTP.PORT,
  secure: true, // true for 465, false for other ports
  auth: {
    user: config.SMTP.USER,
    pass: config.SMTP.PASS,
  },
});

// Verify SMTP connection
transporter.verify((error, success) => {
  if (error) {
    logger.error(`SMTP connection failed: ${error.message}`);
  } else {
    logger.info("SMTP server is ready to take our messages");
  }
});
