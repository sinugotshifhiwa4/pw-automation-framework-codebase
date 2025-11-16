import SecretFileManager from "../../../config/environment/manager/secretFileManager.js";
import EnvPathResolver from "../../../config/environment/pathResolver/envPathResolver.js";
import ErrorHandler from "../../../utils/errorHandling/errorHandler.js";

export default class CryptoEnvironment {
  /**
   * Retrieves the value of a secret key variable from the environment file.
   * Ensures the secret key variable is resolvable and the value is not empty.
   * @param secretKeyVariable - The secret key variable to retrieve
   * @returns Promise resolving to the value of the secret key variable
   * @throws Error if secret key variable is not found or empty
   */
  public static async getSecretKeyFromEnvironment(secretKeyVariable: string): Promise<string> {
    try {
      const secretKeyValue = await SecretFileManager.getKeyValue(
        EnvPathResolver.getSecretFilePath(),
        secretKeyVariable,
      );

      if (!secretKeyValue) {
        ErrorHandler.logAndThrow(
          "CryptoEngine.getSecretKeyFromEnvironment",
          `Secret key variable '${secretKeyVariable}' not found in environment file`,
        );
      }

      return secretKeyValue;
    } catch (error) {
      ErrorHandler.captureError(
        error,
        "getSecretKeyFromEnvironment",
        `Failed to load secret key variable '${secretKeyVariable}`,
      );
      throw error;
    }
  }
}
