import EnvironmentDetector from "../detector/environmentDetector.js";
import EnvironmentConfigManager from "../manager/environmentConfigManager.js";
import EnvironmentVariables from "../variables/environmentVariables.js";
import type { Credentials } from "../../authentication/types/credentials.types.js";

export class RuntimeEnvVariableResolver {
  // Determines if the current execution environment is a Continuous Integration (CI) environment
  private readonly isCI = EnvironmentDetector.isCI();

  /**
   * Retrieves the portal base URL.
   * If running in CI environment, returns the CI_PORTAL_BASE_URL environment variable.
   * Otherwise, returns the PORTAL_BASE_URL environment variable.
   * @returns {Promise<string>} - The portal base URL.
   */
  public getPortalBaseUrl(): string {
    return this.isCI
      ? process.env.CI_PORTAL_BASE_URL!
      : this.getLocalEnvironmentVariable(
          () => EnvironmentVariables.PORTAL_BASE_URL,
          "Portal Base URL",
        );
  }

  /**
   * Returns the portal credentials in the form of {username, password}.
   * In a CI environment, it will use the environment variables
   * CI_PORTAL_USERNAME and CI_PORTAL_PASSWORD.
   * In a non-CI environment, it will use the locally stored
   * environment variables PORTAL_USERNAME and PORTAL_PASSWORD and decrypt them.
   * @returns A promise that resolves to the portal credentials
   */
  async getPortalCredentials(): Promise<Credentials> {
    return this.isCI
      ? EnvironmentConfigManager.verifyCredentials({
          username: process.env.CI_PORTAL_USERNAME!,
          password: process.env.CI_PORTAL_PASSWORD!,
        })
      : this.getDecryptedCredentials(
          EnvironmentVariables.PORTAL_USERNAME,
          EnvironmentVariables.PORTAL_PASSWORD,
        );
  }

  // Helper methods

  /**
   * Gets a local environment variable by resolving the provided value.
   * @template T - Type of the value to resolve.
   * @param getValue - Function to get the value of the environment variable.
   * @param description - Description of the environment variable.
   * @returns A promise resolving to the value of the environment variable.
   * @throws An error if the environment variable is not found.
   */
  private getLocalEnvironmentVariable<T>(getValue: () => T, description: string): T {
    return EnvironmentConfigManager.getEnvironmentVariable(
      getValue,
      description.toLowerCase().replace(/\s+/g, ""),
      `get${description.replace(/\s+/g, "")}`,
      `Failed to get ${description.toLowerCase()}`,
    );
  }

  /**
   * Gets decrypted credentials using the current environment's secret key
   * Verifies that the provided credentials contain both a username and password
   * before attempting to decrypt
   * @param {string} username
   * @param {string} password
   * @returns {Promise<Credentials>}
   */
  private async getDecryptedCredentials(username: string, password: string): Promise<Credentials> {
    const credentials = { username, password };
    EnvironmentConfigManager.verifyCredentials(credentials);

    return EnvironmentConfigManager.decryptCredentials(
      username,
      password,
      EnvironmentConfigManager.getCurrentEnvSecretKey(),
    );
  }
}
