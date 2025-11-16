import winston, { format } from "winston";
import moment from "moment-timezone";
import path from "path";
import * as fs from "fs";
import { winstonLoggerConfig } from "./logger.config.js";
import type { LogLevel } from "./logger.config.js";
import type { EnvironmentStage } from "../../environment/constants/environment.constants.js";

export default class LoggerFactory {
  // Flag to ensure log directory is created only once
  private static directoryEnsured = false;

  /**
   * Creates and configures a Winston logger instance.
   * Sets up file transports for each log level, console output,
   * and handlers for uncaught exceptions and unhandled rejections.
   *
   * @returns {winston.Logger} Fully configured Winston logger
   */
  public static createLogger(): winston.Logger {
    this.ensureLogDirectoryExists();
    const fileTransports = this.createFileTransports();

    return winston.createLogger({
      level: winstonLoggerConfig.logLevels.debug,
      transports: [
        fileTransports.info,
        fileTransports.warn,
        fileTransports.error,
        fileTransports.debug,
        this.createConsoleTransport(),
      ],
      exceptionHandlers: [this.createCustomHandler("exceptions.log")],
      rejectionHandlers: [this.createCustomHandler("rejections.log")],
    });
  }

  /**
   * Ensures the log directory exists.
   * Only creates the directory once per application lifecycle for performance.
   * Thread-safe through static flag.
   *
   * @public Exposed for testing or manual directory setup
   */
  public static ensureLogDirectoryExists(): void {
    if (this.directoryEnsured) {
      return;
    }

    const directory = winstonLoggerConfig.logDirectory;

    try {
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
      this.directoryEnsured = true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to create log directory at ${directory}: ${errorMessage}`);
    }
  }

  /**
   * Creates file transports for all log levels.
   *
   * @private
   * @returns Object containing transport instances for each log level
   */
  private static createFileTransports() {
    const createTransport = this.createTransportFactory(this.createBaseTransportConfig());
    return this.createLogLevelTransports(createTransport);
  }

  /**
   * Creates base configuration shared across all file transports.
   *
   * @private
   * @returns Base transport configuration object
   */
  private static createBaseTransportConfig() {
    return {
      maxsize: winstonLoggerConfig.logFileLimit,
      timestampFormat: this.customTimestampFormat(),
      customFormat: this.logCustomFormat(),
    };
  }

  /**
   * Factory function that creates transport instances with consistent configuration.
   *
   * @private
   * @param baseConfig - Shared configuration for all transports
   * @returns Function that creates a configured file transport
   */
  private static createTransportFactory(
    baseConfig: ReturnType<typeof this.createBaseTransportConfig>,
  ) {
    return (level: LogLevel, filename: string) =>
      new winston.transports.File({
        maxsize: baseConfig.maxsize,
        filename: this.resolvePath(filename),
        level,
        format: this.createCombinedFormat(level, baseConfig),
      });
  }

  /**
   * Combines multiple format transformations for file transports.
   *
   * @private
   * @param level - Log level to filter for
   * @param baseConfig - Base configuration with formats
   * @returns Combined Winston format
   */
  private static createCombinedFormat(
    level: LogLevel,
    baseConfig: ReturnType<typeof this.createBaseTransportConfig>,
  ): winston.Logform.Format {
    return winston.format.combine(
      this.levelFilter(level),
      winston.format.uncolorize(),
      baseConfig.timestampFormat,
      baseConfig.customFormat,
    );
  }

  /**
   * Creates transport instances for each log level.
   *
   * @private
   * @param createTransport - Factory function for creating transports
   * @returns Object mapping log levels to transport instances
   */
  private static createLogLevelTransports(
    createTransport: (
      level: LogLevel,
      filename: string,
    ) => winston.transports.FileTransportInstance,
  ) {
    return {
      info: createTransport(
        winstonLoggerConfig.logLevels.info,
        winstonLoggerConfig.logFilePaths.info,
      ),
      warn: createTransport(
        winstonLoggerConfig.logLevels.warn,
        winstonLoggerConfig.logFilePaths.warn,
      ),
      error: createTransport(
        winstonLoggerConfig.logLevels.error,
        winstonLoggerConfig.logFilePaths.error,
      ),
      debug: createTransport(
        winstonLoggerConfig.logLevels.debug,
        winstonLoggerConfig.logFilePaths.debug,
      ),
    };
  }

  /**
   * Creates console transport with environment-specific log level.
   *
   * @private
   * @returns Configured console transport
   */
  private static createConsoleTransport(): winston.transports.ConsoleTransportInstance {
    const environment = (process.env.ENV as EnvironmentStage) || "dev";

    return new winston.transports.Console({
      level: this.getConsoleLogLevel(environment),
      format: this.createConsoleFormat(),
    });
  }

  /**
   * Creates format for console output with colors and timestamps.
   *
   * @private
   * @returns Combined console format with colorization
   */
  private static createConsoleFormat(): winston.Logform.Format {
    return winston.format.combine(
      this.customTimestampFormat(),
      winston.format.colorize({
        colors: {
          error: "red",
          warn: "yellow",
          info: "green",
          debug: "magenta",
        },
      }),
      this.logCustomFormatColored(),
    );
  }

  /**
   * Creates file handler for exceptions and rejections.
   *
   * @private
   * @param filename - Name of the log file
   * @returns Configured file transport
   */
  private static createCustomHandler(filename: string) {
    return new winston.transports.File({
      filename: this.resolvePath(filename),
      format: this.createUncolorizedFormat(),
    });
  }

  /**
   * Creates uncolorized format for file outputs.
   *
   * @private
   * @returns Combined format without colors
   */
  private static createUncolorizedFormat(): winston.Logform.Format {
    return winston.format.combine(
      winston.format.uncolorize(),
      this.customTimestampFormat(),
      this.logCustomFormat(),
    );
  }

  /**
   * Determines appropriate console log level based on environment.
   * More verbose in development, more restrictive in production.
   *
   * @private
   * @param environment - Current environment stage
   * @returns Appropriate log level for the environment
   */
  private static getConsoleLogLevel(environment: EnvironmentStage): LogLevel {
    const levelMap: Record<EnvironmentStage, LogLevel> = {
      dev: winstonLoggerConfig.logLevels.debug,
      qa: winstonLoggerConfig.logLevels.debug,
      uat: winstonLoggerConfig.logLevels.info,
      preprod: winstonLoggerConfig.logLevels.warn,
      prod: winstonLoggerConfig.logLevels.error,
    };
    return levelMap[environment] ?? winstonLoggerConfig.logLevels.debug;
  }

  /**
   * Creates a filter that only passes logs of a specific level.
   *
   * @private
   * @param level - Log level to filter for
   * @returns Winston format that filters by level
   */
  private static levelFilter(level: LogLevel): winston.Logform.Format {
    return format((info) => (info.level === level ? info : false))();
  }

  /**
   * Creates a custom log format for file outputs.
   * Includes timestamp, log level, and log message.
   *
   * @private
   * @returns Winston format that combines timestamp, log level, and message
   */
  private static logCustomFormat(): winston.Logform.Format {
    return winston.format.printf(
      ({ level, message, timestamp }: winston.Logform.TransformableInfo) => {
        return `${timestamp as string} [${level}]: ${message as string}`;
      },
    );
  }

  /**
   * Creates a custom log format for console outputs with colors.
   * Includes timestamp, log level, and log message.
   *
   * @private
   * @returns Winston format that combines timestamp, log level, and message with colors
   */
  private static logCustomFormatColored(): winston.Logform.Format {
    return winston.format.printf((info: winston.Logform.TransformableInfo) => {
      return `${info.timestamp as string} [${info.level}]: ${info.message as string}`;
    });
  }

  /**
   * Creates timestamp format using configured timezone and date format.
   *
   * @private
   * @returns Winston timestamp format
   */
  private static customTimestampFormat(): winston.Logform.Format {
    return winston.format.timestamp({
      format: () =>
        moment().tz(winstonLoggerConfig.timeZone).format(winstonLoggerConfig.dateFormat),
    });
  }

  /**
   * Resolves filename to absolute path in log directory.
   *
   * @private
   * @param fileName - Name of the log file
   * @returns Absolute path to log file
   */
  private static resolvePath(fileName: string): string {
    return path.join(winstonLoggerConfig.logDirectory, fileName);
  }
}
