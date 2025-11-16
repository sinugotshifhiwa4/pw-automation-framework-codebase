import { SyncFileManager } from "../../../../utils/fileManager/syncFileManager.js";
import { AUTH_FILE_CONFIG } from "./authentication.constants.js";
import ErrorHandler from "../../../../utils/errorHandling/errorHandler.js";

export default class AuthenticationPathResolver {
  private static rootDir: string | null = null;

  /**
   * Returns the path to the CI authentication state file.
   * If sharding is enabled, returns a shard-specific file path.
   * Otherwise, returns a single CI file path.
   * @returns The path to the CI authentication state file
   */
  public static getCIFilePath(): string {
    return this.execute("getCIFilePath", "Failed to get CI file path", () => {
      const root = this.getRootDir();
      const { SHARD_INDEX, SHARD_TOTAL } = process.env;

      // Use shard-specific file if sharding is enabled
      if (SHARD_INDEX && SHARD_TOTAL) {
        return SyncFileManager.join(
          root,
          `${AUTH_FILE_CONFIG.SHARD_INDEX_FILE}${SHARD_INDEX}.json`,
        );
      }

      // Fallback to single CI file
      return SyncFileManager.join(root, AUTH_FILE_CONFIG.CI_AUTH_FILE);
    });
  }

  /**
   * Returns the path to the locally stored authentication state file.
   * @returns The path to the locally stored authentication state file
   */
  public static getLocalFilePath(): string {
    return this.execute("getLocalFilePath", "Failed to get local file path", () =>
      SyncFileManager.join(this.getRootDir(), AUTH_FILE_CONFIG.LOCAL_AUTH_FILE),
    );
  }

  /**
   * Returns the empty authentication state as a string.
   * This is used to reset the authentication state to its initial state.
   * @returns The empty authentication state as a string
   */
  public static getEmptyAuthState() {
    return this.execute(
      "getEmptyAuthState",
      "Failed to get empty auth state",
      () => AUTH_FILE_CONFIG.EMPTY_AUTH_STATE,
    );
  }

  /**
   * Executes a given operation with error handling.
   * If the operation throws an error, logs the error with the given methodName and errorMessage.
   * @param methodName - Name of the calling method for logging context
   * @param errorMessage - Error message to log if the operation fails
   * @param operation - The async operation to execute
   * @returns The result of the operation, or rethrows the operation error
   * @throws Error if the operation fails
   */
  private static execute<T>(methodName: string, errorMessage: string, operation: () => T): T {
    try {
      return operation();
    } catch (error) {
      ErrorHandler.captureError(error, methodName, errorMessage);
      throw error;
    }
  }

  /**
   * Returns the root directory for authentication state files.
   * Lazily initializes and ensures the directory exists on first access.
   * @returns The absolute path to the root directory for authentication state files
   */
  private static getRootDir(): string {
    return this.execute("getRootDir", "Failed to get root directory", () => {
      if (this.rootDir === null) {
        this.rootDir = SyncFileManager.resolve(AUTH_FILE_CONFIG.ROOT_DIRECTORY);
        SyncFileManager.ensureDirectoryExists(this.rootDir);
      }
      return this.rootDir;
    });
  }
}
