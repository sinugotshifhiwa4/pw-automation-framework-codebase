import EnvironmentDetector from "../detector/environmentDetector.js";
import EnvironmentFileManager from "./internal/EnvironmentFileManager.js";
import AuthenticationFileManager from "../../authentication/storage/authenticationFileManager.js";
import ErrorHandler from "../../../utils/errorHandling/errorHandler.js";

/**
 * Initializes the environment config by loading all environment files in sequence.
 * Ensures environment variables are available for the current environment.
 * If initialization fails, logs an error with the error and error message.
 * @returns A promise that resolves when environment config is initialized.
 * @throws An error if initialization fails.
 */
async function initializeEnvironmentConfig(): Promise<void> {
  try {
    await EnvironmentFileManager.getInstance().initialize();
  } catch (error) {
    ErrorHandler.captureError(
      error,
      "initializeEnvironmentConfig",
      "Failed to initialize environment config",
    );
    throw error;
  }
}

/**
 * Initializes the authentication state to an empty state.
 * If the authentication state is already initialized, this function does nothing.
 * @returns A promise that resolves when the authentication state is initialized.
 * @throws An error if initialization fails.
 */
async function initializeEmptyAuthenticationState(): Promise<void> {
  try {
    await AuthenticationFileManager.initialize();
  } catch (error) {
    ErrorHandler.captureError(
      error,
      "initializeEmptyAuthenticationState",
      "Failed to reset authentication state",
    );
    throw error;
  }
}

/**
 * Performs global setup by initializing the environment config and authentication state.
 * If running in a CI environment, only initializes the authentication state.
 * If running in a non-CI environment, initializes both the environment config and authentication state.
 * @throws An error if global setup fails.
 */
async function globalSetup(): Promise<void> {
  try {
    const isCI = EnvironmentDetector.isCI();

    if (isCI) {
      await initializeEmptyAuthenticationState();
    } else {
      await Promise.all([initializeEnvironmentConfig(), initializeEmptyAuthenticationState()]);
    }
  } catch (error) {
    ErrorHandler.captureError(error, "globalSetup", "Failed to perform global setup");
    throw error;
  }
}

export default globalSetup;
