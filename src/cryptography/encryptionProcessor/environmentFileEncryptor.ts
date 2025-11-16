import StagesFileManager from "../../config/environment/manager/stagesFileManager.js";
import EnvironmentConfigManager from "../../config/environment/manager/environmentConfigManager.js";
import { EncryptionVariableResolver } from "./internal/encryptionVariableResolver.js";
import { VariableEncryptionExecutor } from "./internal/variableEncryptionExecutor.js";
import ErrorHandler from "../../utils/errorHandling/errorHandler.js";
import logger from "../../config/logger/loggerManager.js";

export class EnvironmentFileEncryptor {
  private readonly variableResolver: EncryptionVariableResolver;
  private readonly encryptionExecutor: VariableEncryptionExecutor;

  constructor(
    variableResolver: EncryptionVariableResolver,
    encryptionExecutor: VariableEncryptionExecutor,
  ) {
    this.variableResolver = variableResolver;
    this.encryptionExecutor = encryptionExecutor;
  }

  /**
   * Encrypts environment variables in a file.
   * If targetVariables is provided, only the variables in the targetVariables list will be considered for encryption.
   * Otherwise, all variables will be considered for encryption.
   * The function first reads and parses the environment file, then resolves which variables to encrypt,
   * executes the encryption, and finally persists the changes back to the file.
   * @param targetVariables - Optional list of variable names to encrypt
   * @returns Promise resolving to void
   */
  public async encryptEnvironmentVariables(targetVariables?: string[]): Promise<void> {
    return this.wrapWithErrorHandling(
      async () => {
        const filePath = EnvironmentConfigManager.getCurrentEnvFilePath();
        const secretKey = EnvironmentConfigManager.getCurrentEnvSecretKey();
        await this.processEncryption(filePath, secretKey, targetVariables);
      },
      "encryptEnvironmentVariables",
      "Failed to encrypt environment variables",
    );
  }

  /**
   * Processes the encryption of environment variables in a file.
   * This function first reads and parses the environment file, then resolves which variables to encrypt,
   * executes the encryption, and finally persists the changes back to the file.
   * @param filePath - Path to the environment file
   * @param secretKeyVariable - Secret key variable to use for encryption
   * @param targetVariables - Optional list of variable names to encrypt
   * @returns Promise resolving when the encryption is complete
   */
  private async processEncryption(
    filePath: string,
    secretKeyVariable: string,
    targetVariables?: string[],
  ): Promise<void> {
    // Load and parse environment file
    const envFileLines = await StagesFileManager.readEnvironmentFileAsLines(filePath);
    const allVariables = StagesFileManager.extractEnvironmentVariables(envFileLines);

    if (Object.keys(allVariables).length === 0) {
      logger.warn(`No environment variables found in ${filePath}`);
      return;
    }

    // Resolve which variables to encrypt
    const resolutionResult = this.variableResolver.resolveEncryptableVariables(
      allVariables,
      targetVariables,
    );

    if (Object.keys(resolutionResult.toEncrypt).length === 0) {
      return;
    }

    // Execute encryption
    const executionResult = await this.encryptionExecutor.encryptVariables(
      envFileLines,
      resolutionResult.toEncrypt,
      secretKeyVariable,
    );

    // Persist changes
    if (executionResult.encryptedCount > 0) {
      await StagesFileManager.writeEnvironmentFileLines(filePath, executionResult.updatedLines);
    }
  }

  /**
   * Wraps an async operation with error handling. If the operation fails,
   * logs the error with the given methodName and errorMessage.
   * @param operation - The async operation to wrap
   * @param methodName - The name of the method wrapping the operation
   * @param errorMessage - The error message to log if the operation fails
   * @returns A promise resolving to the operation result, or rethrowing the operation error
   */
  private async wrapWithErrorHandling<T>(
    operation: () => Promise<T>,
    methodName: string,
    errorMessage: string,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      ErrorHandler.captureError(error, methodName, errorMessage);
      throw error;
    }
  }
}
