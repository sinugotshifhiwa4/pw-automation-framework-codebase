import { AsyncFileManager } from "../../../utils/fileManager/asyncFileManager.js";
import EnvironmentConfigManager from "../../../config/environment/manager/environmentConfigManager.js";
import { CRYPTO_CONSTANTS } from "../../types/crypto.config.js";
import ErrorHandler from "../../../utils/errorHandling/errorHandler.js";
import logger from "../../../config/logger/loggerManager.js";

export default class EncryptionValidator {
  /**
   * Validates encryption status of specified environment variables
   * @param envVarNames - Array of environment variable names to validate
   * @returns Object mapping variable names to their encryption status
   */
  public static async validateEncryption(envVarNames: string[]): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    const envVars = await this.loadEnvironmentVariables(
      EnvironmentConfigManager.getCurrentEnvFilePath(),
    );

    for (const envVarName of envVarNames) {
      const value = envVars[envVarName];

      if (!value) {
        ErrorHandler.log("validateEncryption", `Environment variable not found: ${envVarName}`);
        results[envVarName] = false;
      } else {
        results[envVarName] = this.isEncrypted(value);
      }
    }

    logger.info(`Encryption validation results: ${JSON.stringify(results)}`);

    return results;
  }

  /**
   * Checks if all specified variables are encrypted
   * @param envVarNames - Array of environment variable names to validate
   * @returns True if all variables are encrypted, false otherwise
   */
  public static async areAllEncrypted(envVarNames: string[]): Promise<boolean> {
    const results = await this.validateEncryption(envVarNames);
    return Object.values(results).every((isEncrypted) => isEncrypted);
  }

  /**
   * Gets a list of unencrypted variables from the specified list
   * @param envVarNames - Array of environment variable names to check
   * @returns Array of variable names that are not encrypted
   */
  public static async getUnencryptedVariables(envVarNames: string[]): Promise<string[]> {
    const results = await this.validateEncryption(envVarNames);
    return Object.entries(results)
      .filter(([, isEncrypted]) => !isEncrypted)
      .map(([envVarName]) => envVarName);
  }

  public static async getDetailedValidationResults(envVarNames: string[]): Promise<
    {
      envVarName: string;
      isEncrypted: boolean;
      exists: boolean;
      valuePreview?: string;
    }[]
  > {
    const envVars = await this.loadEnvironmentVariables(
      EnvironmentConfigManager.getCurrentEnvFilePath(),
    );

    return envVarNames.map((envVarName) => {
      const value = envVars[envVarName];
      const exists = Boolean(value);

      return {
        envVarName,
        isEncrypted: exists ? this.isEncrypted(value) : false,
        exists,
        valuePreview: exists ? `${value.substring(0, 10)}...` : undefined,
      };
    });
  }

  /**
   * Loads and parses environment variables from a file
   * @param filePath - Path to the environment file
   * @returns Parsed environment variables as key-value pairs
   * @throws Error if the environment file is not found
   */
  private static async loadEnvironmentVariables(filePath: string): Promise<Record<string, string>> {
    const exists = await AsyncFileManager.doesFileExist(filePath);

    if (!exists) {
      ErrorHandler.logAndThrow(
        "loadEnvironmentVariables",
        `Environment file not found: ${filePath}`,
      );
    }

    const envContent = await AsyncFileManager.readFile(filePath);
    return this.parseEnvironmentContent(envContent);
  }

  /**
   * Parses environment file content into key-value pairs
   * @param content - Raw content of the environment file
   * @returns Parsed environment variables
   */
  private static parseEnvironmentContent(content: string): Record<string, string> {
    const envVars: Record<string, string> = {};

    content.split("\n").forEach((line) => {
      const trimmedLine = line.trim();

      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith("#")) {
        return;
      }

      const [key, ...valueParts] = trimmedLine.split("=");

      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join("=").trim();
      }
    });

    return envVars;
  }

  /**
   * Checks if a given string is a valid encrypted value
   * A valid encrypted value must start with the correct prefix (ENC2:),
   * contain the correct number of parts (version | salt | iv | encrypted),
   * have a valid version, and all parts must be non-empty and base64
   * @param value - The string to validate
   * @returns True if the value is a valid encrypted string, false otherwise
   */
  private static isEncrypted(value: string): boolean {
    logger.debug(`[isEncrypted] Raw value: "${value}"`);

    if (!value || typeof value !== "string") {
      return false;
    }

    // Check for correct prefix (ENC2:)
    if (!value.startsWith(CRYPTO_CONSTANTS.FORMAT.PREFIX)) {
      return false;
    }

    const withoutPrefix = value.substring(CRYPTO_CONSTANTS.FORMAT.PREFIX.length);

    const parts = withoutPrefix.split(CRYPTO_CONSTANTS.FORMAT.SEPARATOR);

    // Check correct number of parts (version | salt | iv | encrypted)
    if (parts.length !== CRYPTO_CONSTANTS.FORMAT.EXPECTED_PARTS) {
      return false;
    }

    const [version, salt, iv, encrypted] = parts;

    // Validate version matches expected version
    if (version !== CRYPTO_CONSTANTS.FORMAT.VERSION) {
      return false;
    }

    // Validate all parts are non-empty and base64
    const base64Regex = /^[A-Za-z0-9+/]+=*$/;

    const partsToCheck = { salt, iv, encrypted };
    for (const [name, part] of Object.entries(partsToCheck)) {
      if (!part || !base64Regex.test(part)) {
        ErrorHandler.log("isEncrypted", `Failed: ${name} is invalid base64 or empty -> "${part}"`);
        return false;
      }
    }

    return true;
  }
}
