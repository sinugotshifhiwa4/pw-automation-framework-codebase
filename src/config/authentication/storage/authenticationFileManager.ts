import EnvironmentDetector from "../../environment/detector/environmentDetector.js";
import { AsyncFileManager } from "../../../utils/fileManager/asyncFileManager.js";
import { SyncFileManager } from "../../../utils/fileManager/syncFileManager.js";
import AuthenticationPathResolver from "./internal/authPathResolver.js";
import { FileEncoding } from "../../../utils/fileManager/internal/file-encoding.enum.js";
import ErrorHandler from "../../../utils/errorHandling/errorHandler.js";
import logger from "../../logger/loggerManager.js";

export default class AuthenticationFileManager {
  // check if running in CI environment
  private static readonly isCI = EnvironmentDetector.isCI();

  // flag to ensure initialization happens only once per session
  private static isInitialized = false;

  /**
   * Gets the authentication state file path for the current environment
   * @returns Absolute path to the auth state file
   */
  public static getFilePath(): string {
    try {
      const fileName = this.isCI
        ? AuthenticationPathResolver.getCIFilePath()
        : AuthenticationPathResolver.getLocalFilePath();

      return SyncFileManager.resolve(fileName);
    } catch (error) {
      ErrorHandler.captureError(error, "getFilePath", "Failed to resolve auth state file path");
      throw error;
    }
  }

  /**
   * Synchronously resets the auth state file to empty state
   * Use in global setup or synchronous contexts (e.g., Playwright config)
   * @returns The file path that was reset
   */
  public static resetSync(): string {
    try {
      const filePath = this.getFilePath();
      this.writeFileSync(filePath);
      logger.debug(`Reset auth state file (sync): ${filePath}`);
      return filePath;
    } catch (error) {
      ErrorHandler.captureError(
        error,
        "resetSync",
        "Failed to synchronously reset auth state file",
      );
      throw error;
    }
  }

  /**
   * Asynchronously initializes the auth state file to empty state
   * Ensures initialization happens only once per session
   * @returns Promise<true> if successful or already initialized, Promise<false> on failure
   */
  public static async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      logger.debug("Auth state file already initialized in this session");
      return true;
    }

    try {
      const filePath = this.getFilePath();
      await this.writeFileAsync(filePath);

      this.isInitialized = true;
      logger.debug(`Initialized auth state file: ${filePath}`);
      return true;
    } catch (error) {
      ErrorHandler.captureError(error, "initialize", "Failed to initialize auth state file");
      logger.error(`Failed to initialize auth state file: ${error}`);
      return false;
    }
  }

  /**
   * Resets the initialization flag
   * Call this in test cleanup or to force re-initialization
   */
  public static reset(): void {
    this.isInitialized = false;
    logger.debug("Reset auth state manager session flag");
  }

  /**
   * Synchronously writes empty auth state to file
   */
  private static writeFileSync(filePath: string): void {
    const emptyState = AuthenticationPathResolver.getEmptyAuthState();
    SyncFileManager.writeFile(filePath, emptyState, "authStateFile", FileEncoding.UTF8);
  }

  /**
   * Asynchronously writes empty auth state to file
   */
  private static async writeFileAsync(filePath: string): Promise<void> {
    const emptyState = AuthenticationPathResolver.getEmptyAuthState();
    await AsyncFileManager.writeFile(filePath, emptyState, "authStateFile", FileEncoding.UTF8);
  }
}
