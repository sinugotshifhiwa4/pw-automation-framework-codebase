import type { Page } from "@playwright/test";
import ErrorHandler from "../../../../../utils/errorHandling/errorHandler.js";
import logger from "../../../../../config/logger/loggerManager.js";

export class ActionBase {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Execute an action and handle any errors that may occur.
   * @param {() => Promise<T>} action The action to execute.
   * @param {string} callerMethodName The name of the method that called the action.
   * @param {string} [successMessage] Message to log if the action succeeds.
   * @param {string} [errorMessage] Message to log if the action fails.
   * @returns {Promise<T>} A promise that resolves with the result of the action if it succeeds, or rejects with the error if it fails.
   */
  public async performAction<T>(
    action: () => Promise<T>,
    callerMethodName: string,
    successMessage?: string,
    errorMessage?: string,
  ): Promise<T> {
    try {
      const result = await action();
      if (successMessage) logger.info(successMessage);
      return result;
    } catch (error) {
      ErrorHandler.captureError(
        error,
        callerMethodName,
        errorMessage || `Failed to execute ${callerMethodName}`,
      );
      throw error;
    }
  }
}
