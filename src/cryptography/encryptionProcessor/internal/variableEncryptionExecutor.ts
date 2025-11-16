import { CryptoService } from "../../service/cryptoService.js";
import StagesFileManager from "../../../config/environment/manager/stagesFileManager.js";
import EncryptionUtils from "./encryptionUtils.js";
import type { EncryptionExecutionResult } from "../../types/environmentFileEncryptor.type.js";
import ErrorHandler from "../../../utils/errorHandling/errorHandler.js";
import logger from "../../../config/logger/loggerManager.js";

export class VariableEncryptionExecutor {
  /**
   * Encrypts the given environment variable values using the provided secret key variable.
   * Updates the environment file lines with the new encrypted values.
   * @param envFileLines - The environment file lines to update
   * @param variablesToEncrypt - Object containing the variable names and values to encrypt
   * @param secretKeyVariable - Secret key variable to use for encryption
   * @returns Promise resolving to an EncryptionExecutionResult object containing the updated environment file lines and the number of variables that were successfully encrypted
   */
  public async encryptVariables(
    envFileLines: string[],
    variablesToEncrypt: Record<string, string>,
    secretKeyVariable: string,
  ): Promise<EncryptionExecutionResult> {
    try {
      const encryptedValues = await this.encryptAllValues(variablesToEncrypt, secretKeyVariable);
      const updatedLines = this.applyEncryptedValues(envFileLines, encryptedValues);

      return {
        updatedLines,
        encryptedCount: Object.keys(encryptedValues).length,
      };
    } catch (error) {
      ErrorHandler.captureError(error, "encryptVariables", "Failed to encrypt variable values");
      throw error;
    }
  }

  /**
   * Encrypts all the values in the given object using the provided secret key variable.
   * Iterates through the object and encrypts each value using the CryptoService.
   * If a value fails to encrypt, it will be logged and the function will continue to the next value.
   * @param variables - Object containing the values to encrypt
   * @param secretKeyVariable - Secret key variable to use for encryption
   * @returns Object containing the encrypted values
   */
  private async encryptAllValues(
    variables: Record<string, string>,
    secretKeyVariable: string,
  ): Promise<Record<string, string>> {
    // Object to hold encrypted values
    const encrypted: Record<string, string> = {};

    // Array to track variables that failed to encrypt
    const failed: string[] = [];

    for (const [key, value] of Object.entries(variables)) {
      try {
        const trimmedValue = EncryptionUtils.trimSafely(value) || value;
        encrypted[key] = await CryptoService.encrypt(trimmedValue, secretKeyVariable);
        logger.debug(`Successfully encrypted variable: ${key}`);
      } catch (error) {
        failed.push(key);
        logger.error(`Failed to encrypt variable '${key}': ${error}`);
        throw error;
      }
    }

    EncryptionUtils.logIfNotEmpty(failed, (vars) =>
      logger.warn(`Failed to encrypt variables: ${vars.join(", ")}`),
    );

    return encrypted;
  }

  /**
   * Applies the encrypted values to the environment file lines.
   * Updates the environment file lines with the new encrypted values.
   * @param fileLines - The environment file lines to update
   * @param encryptedValues - Object containing the encrypted variable values
   * @returns Updated environment file lines with the encrypted values
   */
  private applyEncryptedValues(
    fileLines: string[],
    encryptedValues: Record<string, string>,
  ): string[] {
    return StagesFileManager.updateMultipleEnvironmentVariables(fileLines, encryptedValues);
  }
}
