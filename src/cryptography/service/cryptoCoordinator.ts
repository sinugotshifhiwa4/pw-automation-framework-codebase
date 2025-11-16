import SecureKeyGenerator from "../key/secureKeyGenerator.js";
import { EnvironmentFileEncryptor } from "../encryptionProcessor/environmentFileEncryptor.js";
import EnvironmentConfigManager from "../../config/environment/manager/environmentConfigManager.js";
import SecretFileManager from "../../config/environment/manager/secretFileManager.js";
import ErrorHandler from "../../utils/errorHandling/errorHandler.js";
import logger from "../../config/logger/loggerManager.js";

export class CryptoCoordinator {
  private environmentFileEncryptor: EnvironmentFileEncryptor;

  constructor(environmentFileEncryptor: EnvironmentFileEncryptor) {
    this.environmentFileEncryptor = environmentFileEncryptor;
  }

  /**
   * Generates a new base64 secret key and stores it in the environment file under the current environment secret key variable.
   * If the secret key already exists, it will not be overwritten.
   * @returns Promise resolving to the generated secret key if successful, throws an error otherwise
   */
  public async generateAndStoreSecretKey(): Promise<string> {
    try {
      const currentEnvKey = EnvironmentConfigManager.getCurrentEnvSecretKey();

      const generatedSecretKey = SecureKeyGenerator.generateBase64SecretKey();

      await SecretFileManager.storeEnvironmentKey(currentEnvKey, generatedSecretKey, {
        skipIfExists: true,
      });

      await SecretFileManager.ensureSecretKeyExists(currentEnvKey);

      logger.info(`Secret key "${currentEnvKey}" generated and stored successfully`);

      return generatedSecretKey;
    } catch (error) {
      ErrorHandler.captureError(
        error,
        "generateSecretKey",
        `Failed to generate secret key "${EnvironmentConfigManager.getCurrentEnvSecretKey()}"`,
      );
      throw error;
    }
  }

  /**
   * Encrypts environment variables specified by `envVariables` using the current secret key.
   * @param {string[]} envVariables - Optional list of environment variables to encrypt.
   * @returns {Promise<void>} - Promise resolved when encryption is complete.
   */
  public async encryptEnvironmentVariables(envVariables?: string[]): Promise<void> {
    try {
      await this.environmentFileEncryptor.encryptEnvironmentVariables(envVariables);
    } catch (error) {
      ErrorHandler.captureError(
        error,
        "encryptEnvironmentVariables",
        "Failed to encrypt environment variables",
      );
      throw error;
    }
  }
}
