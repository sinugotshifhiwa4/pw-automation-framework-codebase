import { test } from "@playwright/test";
import type { Page, Locator } from "@playwright/test";
import { ActionBase } from "./actionBase.js";
import DataSanitizer from "../../../../../utils/sanitization/dataSanitizer.js";
import ErrorHandler from "../../../../../utils/errorHandling/errorHandler.js";
import logger from "../../../../../config/logger/loggerManager.js";

export class ElementActions extends ActionBase {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Fill an element with a given value.
   * @param element The element to fill.
   * @param value The value to fill the element with.
   * @param callerMethodName The name of the method that called this function.
   * @param elementName The name of the element (optional).
   * @param {force} If true, forces the fill action even if the element is readonly.
   * @returns A promise that resolves with the result of the fill action if it succeeds, or rejects with the error if it fails.
   */
  async fillElement(
    element: Locator,
    callerMethodName: string,
    value: string,
    elementName?: string,
    options?: { force?: boolean },
  ) {
    // Use the sanitizer helper method
    const { displayValue, isSensitive } = DataSanitizer.sanitizeFieldValue(
      elementName || "element not specified",
      value,
    );
    const stepTitle = isSensitive
      ? `Fill ${elementName} with ${displayValue}`
      : `Fill ${elementName} with "${displayValue}"`;
    const successMessage = `${elementName || "element"} filled successfully with value: ${displayValue}`;
    const errorMessage = `Failed to fill ${elementName || "element"}`;

    await test.step(stepTitle, async () => {
      try {
        await element.fill(value, { force: options?.force || false });
        logger.info(successMessage);
      } catch (error) {
        ErrorHandler.captureError(error, callerMethodName, errorMessage);
        throw error;
      }
    });
  }

  /**
   * Press digits sequentially in an element.
   * @param element The element to press the digits in.
   * @param text The string of digits to press sequentially.
   * @param callerMethodName The name of the method that called this function.
   * @param elementName The name of the element (optional).
   * @returns A promise that resolves with the result of the press action if it succeeds, or rejects with the error if it fails.
   */
  async typeDigitsSequentially(
    element: Locator,
    text: string,
    callerMethodName: string,
    elementName?: string,
  ) {
    await this.performAction(
      async () => {
        await element.pressSequentially(text);
      },
      callerMethodName,
      `Digits entered sequentially in ${elementName || "element"}`,
      `Error entering digits sequentially in ${elementName || "element"}`,
    );
  }

  /**
   * Clicks an element
   * @param element The element locator
   * @param callerMethodName The name of the method that called this function.
   * @param elementName The name of the element (optional).
   * @param options Optional parameters for the click action
   * @param options.force A boolean indicating whether to force the action
   * @returns A promise that resolves with the result of the click action if it succeeds, or rejects with the error if it fails.
   */
  async clickElement(
    element: Locator,
    callerMethodName: string,
    elementName?: string,
    options?: { force?: boolean },
  ) {
    await this.performAction(
      () => element.click({ force: options?.force || false }),
      callerMethodName,
      `Clicked on ${elementName}`,
      `Error clicking on ${elementName}`,
    );
  }

  /**
   * Clears an element.
   * @param element The element locator
   * @param callerMethodName The name of the method that called this function.
   * @param elementName The name of the element (optional).
   * @returns A promise that resolves with the result of the clear action if it succeeds, or rejects with the error if it fails.
   */
  async clearElement(element: Locator, callerMethodName: string, elementName?: string) {
    await this.performAction(
      () => element.clear(),
      callerMethodName,
      `Cleared ${elementName}`,
      `Error clearing ${elementName}`,
    );
  }

  /**
   * Selects an option in an element.
   * @param element The element locator.
   * @param callerMethodName The name of the method that called this function.
   * @param optionValue The value of the option to select.
   * @param elementName The name of the element (optional).
   * @returns A promise that resolves with the result of the select action if it succeeds, or rejects with the error if it fails.
   */
  async selectOption(
    element: Locator,
    callerMethodName: string,
    optionValue: string,
    elementName?: string,
  ) {
    const cleanOptionValue = optionValue.replace(/^["']|["']$/g, "");

    return this.performAction(
      () => element.selectOption(cleanOptionValue),
      callerMethodName,
      `${elementName} option selected successfully with value: ${cleanOptionValue}`,
      `Error selecting option in ${elementName}`,
    );
  }

  /**
   * Focuses an element, i.e., sets focus on it.
   * @param element The element locator
   * @param callerMethodName The name of the method that called this function
   * @param elementName The name of the element (optional)
   * @returns A promise that resolves with the result of the focus action if it succeeds, or rejects with the error if it fails.
   */
  async focusElement(
    element: Locator,
    callerMethodName: string,
    elementName?: string,
  ): Promise<void> {
    return this.performAction(
      () => element.focus(),
      callerMethodName,
      `Focused on ${elementName}`,
      `Failed to focus on ${elementName}`,
    );
  }

  /**
   * Blurs an element, i.e., removes focus from it.
   * @param element The element locator.
   * @param callerMethodName The name of the method that called this function.
   * @param elementName The name of the element (optional).
   * @returns A promise that resolves with the result of the blur action if it succeeds, or rejects with the error if it fails.
   */
  async blurElement(
    element: Locator,
    callerMethodName: string,
    elementName?: string,
  ): Promise<void> {
    return this.performAction(
      () => element.blur(),
      callerMethodName,
      `Blurred ${elementName}`,
      `Failed to blur ${elementName}`,
    );
  }

  /**
   * Checks an element, i.e., adds the checked state to it.
   * @param element The element locator.
   * @param callerMethodName The name of the method that called this function.
   * @param elementName The name of the element (optional).
   * @returns A promise that resolves with the result of the check action if it succeeds, or rejects with the error if it fails.
   * @example
   * await checkElement(element, "checkElement", "checkbox");
   */
  async checkElement(
    element: Locator,
    callerMethodName: string,
    elementName?: string,
  ): Promise<void> {
    await this.performAction(
      () => element.check({ force: true }),
      callerMethodName,
      `${elementName} checked successfully`,
      `Failed to check ${elementName}`,
    );
  }

  /**
   * Unchecks an element, i.e., removes the checked state from it.
   * @param element The element locator.
   * @param callerMethodName The name of the method that called this function.
   * @param elementName The name of the element (optional).
   * @returns A promise that resolves with the result of the uncheck action if it succeeds, or rejects with the error if it fails.
   */
  async uncheckElement(
    element: Locator,
    callerMethodName: string,
    elementName?: string,
  ): Promise<void> {
    await this.performAction(
      () => element.uncheck({ force: true }),
      callerMethodName,
      `${elementName} unchecked successfully`,
      `Failed to uncheck ${elementName}`,
    );
  }

  /**
   * Hovers over an element.
   * @param element The element locator.
   * @param callerMethodName The name of the method that called this function.
   * @param elementName The name of the element (optional).
   * @returns A promise that resolves with the result of the hover action if it succeeds, or rejects with the error if it fails.
   * @example
   * await hoverElement(element, "hoverElement", "button");
   */
  async hoverElement(
    element: Locator,
    callerMethodName: string,
    elementName?: string,
  ): Promise<void> {
    await this.performAction(
      async () => {
        await element.hover();
      },
      callerMethodName,
      `Hovered on ${elementName}`,
      `Failed to hover on ${elementName}`,
    );
  }

  /**
   * Hovers over an element and then clicks on it.
   * @param element The element locator.
   * @param callerMethodName The name of the method that called this function.
   * @param elementName The name of the element (optional).
   * @returns A promise that resolves with the result of the hover and click action if it succeeds, or rejects with the error if it fails.
   * @example
   * await hoverThenClick(element, "hoverThenClick", "button");
   */
  async hoverThenClick(
    element: Locator,
    callerMethodName: string,
    elementName?: string,
  ): Promise<void> {
    await this.performAction(
      async () => {
        await this.hoverElement(element, callerMethodName, elementName);
        await this.clickElement(element, callerMethodName, elementName);
      },
      callerMethodName,
      `Hovered and clicked on ${elementName || "element"}`,
      `Failed to hover and click on ${elementName || "element"}`,
    );
  }

  /**
   * Double-clicks an element.
   * @param element The element locator.
   * @param callerMethodName The name of the method that called this function.
   * @param elementName The name of the element (optional).
   * @param options Optional parameters for the double-click action.
   * @returns A promise that resolves with the result of the double-click action if it succeeds, or rejects with the error if it fails.
   * @example
   * await doubleClickElement(element, "doubleClickElement", "button", { force: true });
   */
  async doubleClickElement(
    element: Locator,
    callerMethodName: string,
    elementName?: string,
    options?: { force?: boolean },
  ): Promise<void> {
    await this.performAction(
      () => element.dblclick({ force: options?.force || false }),
      callerMethodName,
      `Double-clicked on ${elementName}`,
      `Failed to double-click on ${elementName}`,
    );
  }

  /**
   * Right-clicks an element.
   * @param element The element locator.
   * @param callerMethodName The name of the method that called this function.
   * @param elementName The name of the element (optional).
   * @param options Optional parameters for the right-click action.
   * @returns A promise that resolves with the result of the right-click action if it succeeds, or rejects with the error if it fails.
   * @example
   * await rightClickElement(element, "rightClickElement", "button", { force: true });
   */
  async rightClickElement(
    element: Locator,
    callerMethodName: string,
    elementName?: string,
    options?: { force?: boolean },
  ): Promise<void> {
    await this.performAction(
      () => element.click({ button: "right", force: options?.force || false }),
      callerMethodName,
      `Right-clicked on ${elementName}`,
      `Failed to right-click on ${elementName}`,
    );
  }

  /**
   * Drags an element to another element.
   * @param sourceElement The element to drag.
   * @param targetElement The element to drag to.
   * @param callerMethodName The name of the method that called this function.
   * @param sourceElementName The name of the source element (optional).
   * @param targetElementName The name of the target element (optional).
   * @param options Optional parameters for the drag action.
   * @returns A promise that resolves with the result of the drag action if it succeeds, or rejects with the error if it fails.
   * @example
   * await dragTo(sourceElement, targetElement, "dragTo", "source", "target", { force: true });
   */
  async dragTo(
    sourceElement: Locator,
    targetElement: Locator,
    callerMethodName: string,
    sourceElementName?: string,
    targetElementName?: string,
    options?: {
      force?: boolean;
      sourcePosition?: { x: number; y: number };
      targetPosition?: { x: number; y: number };
    },
  ): Promise<void> {
    await this.performAction(
      async () => {
        const dragOptions: {
          force?: boolean;
          sourcePosition?: { x: number; y: number };
          targetPosition?: { x: number; y: number };
        } = {};

        if (options?.force !== undefined) {
          dragOptions.force = options.force;
        }
        if (options?.sourcePosition) {
          dragOptions.sourcePosition = options.sourcePosition;
        }
        if (options?.targetPosition) {
          dragOptions.targetPosition = options.targetPosition;
        }

        await sourceElement.dragTo(targetElement, dragOptions);
      },
      callerMethodName,
      `Dragged ${sourceElementName || "element"} to ${targetElementName || "target"}`,
      `Failed to drag ${sourceElementName || "element"} to ${targetElementName || "target"}`,
    );
  }
}
