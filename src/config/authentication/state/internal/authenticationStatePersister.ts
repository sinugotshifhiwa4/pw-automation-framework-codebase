import type { Page } from "@playwright/test";
import { BasePage } from "../../../../layers/ui/base/basePage.js";
import AuthenticationFileManager from "../../storage/authenticationFileManager.js";
import ErrorHandler from "../../../../utils/errorHandling/errorHandler.js";
import logger from "../../../logger/loggerManager.js";

export class AuthenticationStatePersister extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Saves the current authentication state to a file.
   * This method is used to persist the authentication state across test runs.
   * @returns A promise that resolves to true if the authentication state is saved successfully, or re-throws the error if saving fails.
   */
  public async saveAuthenticationState(): Promise<boolean> {
    try {
      const storagePath = AuthenticationFileManager.getFilePath();
      await this.page.context().storageState({ path: storagePath });
      logger.debug(`Authentication state saved successfully`);
      return true;
    } catch (error) {
      ErrorHandler.captureError(
        error,
        "saveAuthenticationState",
        "Failed to save authentication state",
      );
      throw error;
    }
  }
}
