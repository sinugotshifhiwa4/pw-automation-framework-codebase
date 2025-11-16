import { SyncFileManager } from "../../../utils/fileManager/syncFileManager.js";
import ErrorHandler from "../../../utils/errorHandling/errorHandler.js";
import logger from "../../../config/logger/loggerManager.js";

export class EncryptionOperationLogger {
  /**
   * Logs a summary of an encryption operation
   * @param filePath - Path to the environment file
   * @param variablesToEncrypt - Object containing variable names and values to encrypt
   * @param encryptedCount - The number of variables that were successfully encrypted
   */
  public logOperationSummary(
    filePath: string,
    variablesToEncrypt: Record<string, string>,
    encryptedCount: number,
  ) {
    try {
      const totalVariables = Object.keys(variablesToEncrypt).length;
      const skippedCount = totalVariables - encryptedCount;

      if (encryptedCount === 0) {
        logger.info(`No variables needed encryption in ${filePath}`);
        return;
      }

      const fileName = SyncFileManager.getBaseNameWithExtension(filePath);
      const summary = `Encryption completed. ${encryptedCount} variables processed from '${fileName}'`;
      const details = skippedCount > 0 ? `, ${skippedCount} skipped` : "";

      logger.info(`${summary}${details}`);
    } catch (error) {
      ErrorHandler.captureError(
        error,
        "logOperationSummary",
        `Failed to log encryption summary for ${filePath}`,
      );
      throw error;
    }
  }
}
