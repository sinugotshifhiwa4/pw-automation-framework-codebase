import type { Page, Locator, Cookie, TestInfo, Response } from "@playwright/test";
import { ActionBase } from "./actionBase.js";
import ErrorHandler from "../../../../../utils/errorHandling/errorHandler.js";
import logger from "../../../../../config/logger/loggerManager.js";

export class BrowserActions extends ActionBase {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Refresh the current page
   */
  public refreshPage(): Promise<Response | null> {
    return this.performAction(
      () => this.page.reload(),
      "Page refreshed successfully",
      "Failed to refresh page",
    );
  }

  public async switchTab(index: number): Promise<void> {
    await this.performAction(
      async () => {
        const pages = this.page.context().pages();
        if (index >= pages.length) {
          throw new Error(`Tab index ${index} does not exist. Total tabs: ${pages.length}`);
        }
        await pages[index]?.bringToFront();
      },
      `Switched to tab index ${index}`,
      `Failed to switch to tab index ${index}`,
    );
  }

  /**
   * Close current tab
   */
  public async closeTab(): Promise<void> {
    await this.performAction(
      () => this.page.close(),
      "Current tab closed",
      "Failed to close current tab",
    );
  }

  /**
   * Handle JavaScript alert/confirm/prompt dialogs
   * @param action Action to take: 'accept' or 'dismiss'
   * @param promptText Text to enter for prompt dialogs (optional, only used for prompt type)
   */
  public handleDialog(action: "accept" | "dismiss", promptText?: string) {
    this.page.once("dialog", async (dialog) => {
      try {
        if (action === "accept") {
          if (dialog.type() === "prompt" && promptText !== undefined) {
            await dialog.accept(promptText);
          } else {
            await dialog.accept();
          }
        } else {
          await dialog.dismiss();
        }
        logger.info(
          `Dialog ${action}ed: ${dialog.type()}${promptText ? ` with text: "${promptText}"` : ""}`,
        );
      } catch (error) {
        ErrorHandler.captureError(error, "handleDialog", `Failed to handle dialog`);
        throw error;
      }
    });
  }

  /**
   * Get all cookies from current context
   * @returns Array of cookies
   */
  public async getCookies(): Promise<Cookie[]> {
    return this.performAction(
      () => this.page.context().cookies(),
      `Retrieved all cookies`,
      `Failed to get cookies`,
    );
  }

  /**
   * Add cookie to current context
   * @param cookie Cookie object to add
   */
  public async addCookie(cookie: Cookie): Promise<void> {
    await this.performAction(
      () => this.page.context().addCookies([cookie]),
      `Cookie added: ${cookie.name}`,
      `Failed to add cookie: ${cookie.name}`,
    );
  }

  /**
   * Clear all cookies
   */
  public async clearCookies(): Promise<void> {
    await this.performAction(
      () => this.page.context().clearCookies(),
      `All cookies cleared`,
      `Failed to clear cookies`,
    );
  }

  /**
   * Scroll element into view
   * @param element The element locator
   * @param elementName The name of the element (optional)
   */
  public async scrollElementIntoView(element: Locator, elementName?: string): Promise<void> {
    await this.performAction(
      () => element.scrollIntoViewIfNeeded(),
      `Scrolled ${elementName} into view`,
      `Failed to scroll ${elementName} into view`,
    );
  }

  /**
   * Scroll page to specific coordinates
   * @param x X coordinate
   * @param y Y coordinate
   */
  public async scrollTo(x: number, y: number): Promise<void> {
    await this.performAction(
      () => this.page.evaluate(({ x, y }) => window.scrollTo(x, y), { x, y }),
      `Scrolled to coordinates (${x}, ${y})`,
      `Failed to scroll to coordinates (${x}, ${y})`,
    );
  }

  /**
   * Attach a screenshot to the test report (Playwright HTML report).
   * @param fileName The name to show in the report
   * @param testInfo Playwright testInfo object
   * @param page Optional: page to capture (defaults to `this.page`)
   */
  public async attachScreenshotToReport(
    fileName: string,
    testInfo: TestInfo,
    page: Page = this.page,
  ): Promise<void> {
    await testInfo.attach(fileName, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  }
}
