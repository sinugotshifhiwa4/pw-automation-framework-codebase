import type { Locator } from "@playwright/test";
import { BasePage } from "../../base/basePage.js";
import type { ToggleOptions } from "../types/toggle.type.js";
import ErrorHandler from "../../../../utils/errorHandling/errorHandler.js";
import logger from "../../../../config/logger/loggerManager.js";

export class ToggleManager extends BasePage {
  /**
   * Sets the toggle state of an element.
   * @param element The element locator.
   * @param state The desired toggle state object ({ value: true/false }).
   * @param entityName The name of the entity for logging purposes.
   */
  public async setToggleState(
    element: Locator,
    state: ToggleOptions,
    entityName: string,
  ): Promise<void> {
    const desiredState = state.value;
    const currentState = await this.getToggleState(element, entityName);

    if (currentState !== desiredState) {
      await this.element.clickElement(element, `${entityName} Toggle`);

      // Wait for the toggle state to match the expected state
      await this.waitForToggleState(element, desiredState, entityName);
    }

    logger.info(`${entityName} Toggle is now ${desiredState ? "enabled" : "disabled"}`);
  }

  /**
   * Retrieves the toggle state of an element.
   * @param element The element locator.
   * @param entityName The name of the entity for logging.
   * @returns Boolean indicating the toggle state of the element.
   */
  public async getToggleState(element: Locator, entityName: string): Promise<boolean> {
    try {
      const ariaChecked = await element.getAttribute("aria-checked");
      const isChecked = ariaChecked === "true";

      logger.debug(`${entityName} Toggle state: ${isChecked}`);
      return isChecked;
    } catch (error) {
      ErrorHandler.captureError(
        error,
        "getToggleState",
        `Failed to get ${entityName} toggle state`,
      );
      throw error;
    }
  }

  /**
   * Waits for the toggle state of an element to match the expected state.
   * Polls every 500 ms for up to 10 seconds.
   * @param element The element locator.
   * @param expectedState The expected toggle state of the element.
   * @param entityName The name of the entity for logging.
   * @returns A promise that resolves when the toggle state of the element matches the expected state.
   * @throws {Error} If the toggle state does not match the expected state within the timeout period.
   */
  private async waitForToggleState(
    element: Locator,
    expectedState: boolean,
    entityName: string,
    timeout = 10_000,
    interval = 500,
  ): Promise<void> {
    const start = Date.now();

    try {
      await element.waitFor({ state: "visible", timeout });

      while (Date.now() - start < timeout) {
        const currentState =
          (await element.isChecked?.()) ?? (await element.isEnabled?.()) ?? false;

        if (currentState === expectedState) {
          logger.debug(
            `${entityName} toggle state confirmed as ${expectedState ? "enabled" : "disabled"}`,
          );
          return;
        }

        await this.page.waitForTimeout(interval);
      }

      ErrorHandler.logAndThrow(
        "waitForToggleState",
        `Timed out after ${timeout}ms waiting for ${entityName} toggle to become ${expectedState}`,
      );
    } catch (error) {
      ErrorHandler.captureError(
        error,
        "waitForToggleState",
        `Failed to wait for ${entityName} toggle state to change to ${expectedState}`,
      );
      throw error;
    }
  }
}
