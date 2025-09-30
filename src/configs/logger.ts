import winston from "winston";
import path from "path";
import "winston-daily-rotate-file";
import { config } from "./config";

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for console logs
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
};
winston.addColors(colors);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize({ all: true }), // color for console
  winston.format.printf(
    (info) => `[${info.timestamp}] ${info.level}: ${info.message}`
  )
);

// Daily Rotate File transport factory
const dailyRotateFileTransport = (level: string) =>
  new winston.transports.DailyRotateFile({
    filename: path.join(__dirname, "../../logs", `${level}-%DATE%.log`),
    datePattern: "YYYY-MM-DD",
    level: level,
    zippedArchive: true, // compress old logs
    maxFiles: "15d", // keep logs for 15 days
  });

// Create logger instance
export const logger = winston.createLogger({
  level: config.LOG_LEVEL, // dynamic log level via env
  levels: logLevels,
  format: logFormat,
  transports: [
    new winston.transports.Console(), // logs to console
    dailyRotateFileTransport("error"), // error logs file
    dailyRotateFileTransport("info"), // info logs file
    dailyRotateFileTransport("http"), // http logs file
  ],
});

// Morgan integration stream
export const loggerStream = {
  write: (message: string) => {
    logger.http(message.trim()); // Morgan logs pass to Winston http level
  },
};
