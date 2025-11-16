/**
 * Strongly typed logger configuration.
 * Centralizes all logging settings used by Winston.
 */
export interface LoggerConfig {
  readonly logFileLimit: number;
  readonly timeZone: string;
  readonly dateFormat: string;
  readonly logLevels: LogLevels;
  readonly logFilePaths: LogFilePaths;
  readonly logDirectory: string;
}

/**
 * Supported log levels.
 */
export interface LogLevels {
  readonly debug: "debug";
  readonly info: "info";
  readonly error: "error";
  readonly warn: "warn";
}

/**
 * Supported log file names per log level.
 */
export interface LogFilePaths {
  readonly debug: "debug.log";
  readonly info: "info.log";
  readonly error: "error.log";
  readonly warn: "warn.log";
}
