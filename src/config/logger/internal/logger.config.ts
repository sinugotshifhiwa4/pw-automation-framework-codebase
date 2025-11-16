import path from "path";
import { LoggerConfig, LogLevels, LogFilePaths } from "./types/logger.type.js";

/**
 * Winston logger settings for consistent log handling across the application.
 *
 * Includes:
 * - Maximum log file size before rotation.
 * - Timezone and timestamp format for logs.
 * - Supported log levels (debug, info, error, warn).
 * - File paths per log level.
 * - Directory for storing log files.
 */
export const winstonLoggerConfig: LoggerConfig = {
  logFileLimit: 10 * 1024 * 1024,
  timeZone: "Africa/Johannesburg",
  dateFormat: "YYYY-MM-DDTHH:mm:ssZ",
  logLevels: {
    debug: "debug",
    info: "info",
    error: "error",
    warn: "warn",
  },
  logFilePaths: {
    debug: "debug.log",
    info: "info.log",
    error: "error.log",
    warn: "warn.log",
  },
  logDirectory: path.resolve(process.cwd(), "logs"),
} as const;

// Derived union types for stronger compile-time guarantees
export type LogLevel = LogLevels[keyof LogLevels];
export type LogFilePath = LogFilePaths[keyof LogFilePaths];
