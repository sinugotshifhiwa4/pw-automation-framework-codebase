import EnvironmentDetector from "../detector/environmentDetector.js";
import { CryptoService } from "../../../cryptography/service/cryptoService.js";
import DataSanitizer from "../../../utils/sanitization/dataSanitizer.js";
import EnvPathResolver from "../pathResolver/envPathResolver.js";
import type { Credentials } from "../../authentication/types/credentials.types.js";
import type { EnvironmentStage } from "../constants/environment.constants.js";
import ErrorHandler from "../../../utils/errorHandling/errorHandler.js";

export default class EnvironmentConfigManager {
  /**
   * Retrieves an environment variable value and sanitizes it if necessary.
   * @template T - The type of the environment variable
   * @param getValue - A function that returns the environment variable value
   * @param variableName - The name of the environment variable
   * @param methodName - The name of the method calling this function
   * @param errorMessage - An error message to log if the environment variable is invalid
   * @returns The environment variable value, sanitized if necessary
   */
  public static getEnvironmentVariable<T>(
    getValue: () => T,
    variableName: string,
    methodName: string,
    errorMessage: string,
  ): T {
    try {
      const value = getValue();
      this.validateEnvironmentVariable(String(value), variableName);

      const shouldSanitize = EnvironmentDetector.isCI();

      if (typeof value === "string") {
        return shouldSanitize ? (DataSanitizer.sanitizeString(value) as T) : value;
      }

      return value;
    } catch (error) {
      ErrorHandler.captureError(error, methodName, errorMessage);
      throw error;
    }
  }

  /**
   * Decrypts credentials using the provided secret key
   */
  public static async decryptCredentials(
    username: string,
    password: string,
    secretKey: string,
  ): Promise<Credentials> {
    try {
      const decryptedCredentials = await CryptoService.decryptMultiple(
        [username, password],
        secretKey,
      );

      return {
        username: decryptedCredentials[0],
        password: decryptedCredentials[1],
      };
    } catch (error) {
      ErrorHandler.captureError(error, "decryptCredentials", "Failed to decrypt credentials");
      throw error;
    }
  }

  /**
   * Verifies that the provided credentials contain both a username and password
   */
  public static verifyCredentials(credentials: Credentials): Credentials {
    if (!credentials.username || !credentials.password) {
      ErrorHandler.logAndThrow(
        "FetchLocalEnvironmentVariables",
        "Invalid credentials: Missing username or password.",
      );
    }

    return credentials;
  }

  /**
   * Validates that an environment variable is not empty
   */
  public static validateEnvironmentVariable(value: string, variableName: string): void {
    if (!value || value.trim() === "") {
      ErrorHandler.logAndThrow(
        "FetchLocalEnvironmentVariables",
        `Environment variable ${variableName} is not set or is empty`,
      );
    }
  }

  /**
   * Retrieves the current environment secret key variable value.
   * Looks for the 'SECRET_KEY_ENV' variable in the environment files and returns its value.
   * If the variable is not found or is empty, an error is thrown.
   * @returns The current environment secret key variable value
   */
  public static getCurrentEnvSecretKey(): string {
    return this.getCurrentEnvValue(
      EnvPathResolver.getSecretVariables(),
      "getSecretKeyVariable",
      "secret key",
    );
  }

  /**
   * Retrieves the path to the current environment file.
   * Looks for the 'ENV' or 'NODE_ENV' environment variable and returns the path to the corresponding environment file.
   * If the variable is not found or is empty, an error is thrown.
   * @returns The path to the current environment file
   */
  public static getCurrentEnvFilePath(): string {
    return this.getCurrentEnvValue(
      EnvPathResolver.getEnvironmentStages(),
      "getEnvironmentStageFilePath",
      "environment file",
    );
  }

  /**
   * Generic helper to get environment-specific values
   */
  private static getCurrentEnvValue(
    source: Record<string, string>,
    methodName: string,
    resourceType: string,
  ): string {
    const currentEnvironment = EnvironmentDetector.getCurrentEnvironmentStage();
    return this.getEnvValue(
      source,
      currentEnvironment,
      methodName,
      `Failed to select ${resourceType}. Invalid environment: ${currentEnvironment}. Must be 'dev', 'qa', 'uat', 'preprod' or 'prod'`,
    );
  }

  /**
   * Retrieves an environment-specific value from a given source object.
   * @param source - Object containing environment-specific values
   * @param environment - Environment stage to retrieve the value for
   * @param methodName - Name of the calling method for logging context
   * @param errorMessage - Error message to log if the value is not found
   * @returns The environment-specific value
   * @throws Error if the value is not found
   */
  private static getEnvValue<T extends Record<string, string>>(
    source: T,
    environment: EnvironmentStage,
    methodName: string,
    errorMessage: string,
  ): string {
    if (source[environment]) {
      return source[environment];
    }

    ErrorHandler.logAndThrow(methodName, errorMessage);
  }
}
