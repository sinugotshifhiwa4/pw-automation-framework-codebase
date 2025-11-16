import { expect } from "@playwright/test";
import type { Page, Locator } from "@playwright/test";
import { BasePage } from "../../base/basePage.js";
import TimeoutManager from "../../../../config/timeouts/timeoutManager.js";
import { TableStabilityHelper } from "./internal/tableStabilityHelper.js";
import type { StabilityConfig, TableRowCountResult } from "../types/tableManager.type.js";
import ErrorHandler from "../../../../utils/errorHandling/errorHandler.js";
import logger from "../../../../config/logger/loggerManager.js";

export class TableManager extends BasePage {
  public readonly tableRows: Locator;

  constructor(page: Page) {
    super(page);
    this.tableRows = page.locator("tbody > tr");
  }

  /**
   * Retrieves the stable count of table rows, including whether a "no results" message is detected.
   * If the row count does not stabilize within the given number of attempts, the function will return the final count.
   * If the final count is 1, the function will check one last time for a "no results" message.
   *
   * @param config - Optional configuration for stability checking
   * @returns {Promise<TableRowCountResult>} Result object with count and no-results flag
   */
  public async getRowCount(config: StabilityConfig = {}): Promise<TableRowCountResult> {
    const {
      maxAttempts = TableStabilityHelper.DEFAULT_MAX_ATTEMPTS,
      stabilityThreshold = TableStabilityHelper.DEFAULT_STABILITY_THRESHOLD,
      delayMs = TableStabilityHelper.DEFAULT_DELAY_MS,
      noResultsTexts = TableStabilityHelper.DEFAULT_NO_RESULTS_TEXTS,
    } = config;

    try {
      await this.waitForFirstRowVisible();

      const result = await TableStabilityHelper.waitForStableRowCountPoll(
        () => this.countTableRows(),
        (texts) => this.checkForNoResultsInFirstRow(texts),
        maxAttempts,
        stabilityThreshold,
        delayMs,
        noResultsTexts,
      );

      if (result !== null) {
        logger.debug(
          `Stable row count achieved: ${result.count}${result.isNoResultsMessage ? " (no results message)" : ""}`,
        );
        return result;
      }

      const finalCount = await this.countTableRows();
      logger.warn(
        `Row count stability not achieved after ${maxAttempts} attempts. Using final count: ${finalCount}`,
      );

      // Check one final time for no results message
      const isNoResults = finalCount === 1 ? await this.hasNoResults(noResultsTexts) : false;

      return {
        count: isNoResults ? 0 : finalCount,
        isNoResultsMessage: isNoResults,
      };
    } catch (error) {
      ErrorHandler.captureError(error, "getRowCount", "Failed to get stable table row count");
      throw error;
    }
  }

  /**
   * Checks if the table currently displays a "no results" message.
   *
   * @param noResultsTexts - Optional array of text patterns to check. Defaults to common patterns.
   * @returns {Promise<boolean>} True if a "no results" message is detected, false otherwise
   */
  public async hasNoResults(
    noResultsTexts: string[] = TableStabilityHelper.DEFAULT_NO_RESULTS_TEXTS,
  ): Promise<boolean> {
    try {
      const count = await this.countTableRows();

      // No results messages are typically shown in a single row
      if (count !== 1) {
        return false;
      }

      return await this.checkForNoResultsInFirstRow(noResultsTexts);
    } catch (error) {
      logger.warn("Failed to check for no results state", error);
      return false;
    }
  }

  /**
   * Waits for the table row count to match the given expected page size.
   *
   * @param expectedPageSize - Expected page size. Defaults to 10.
   * @returns {Promise<void>} Resolves when the table row count matches the expected page size
   */
  public async waitForTableRowsToMatchPageSize(expectedPageSize = 10): Promise<void> {
    await expect
      .poll(() => this.countTableRows(), {
        timeout: TimeoutManager.timeout(6000),
        intervals: [200, 400, 800, 1000],
      })
      .toBe(expectedPageSize);
  }

  /**
   * Retrieves all table rows in the table after verifying that the table has
   * finished loading and the row count has stabilized.
   *
   * @param config - Optional configuration for stability checking
   * @returns {Promise<Locator[]>} Array of Locator objects representing all table rows
   */
  public async getAllRows(config?: StabilityConfig): Promise<Locator[]> {
    await this.getRowCount(config);
    return this.tableRows.all();
  }

  /**
   * Verifies that all rows in the table contain the given element.
   *
   * @param selector - Locator string to identify the element to verify
   * @param elementDescription - Description of the element for logging
   * @param expectedCount - How many elements are expected in each row. Defaults to 1.
   * @param config - Optional configuration for stability checking
   * @returns {Promise<void>}
   */
  public async verifyRowsContainElement(
    selector: string,
    elementDescription: string,
    expectedCount: number = 1,
    config?: StabilityConfig,
  ): Promise<void> {
    const rows = await this.getAllRows(config);

    logger.debug(`Verifying ${elementDescription} in ${rows.length} rows`);

    if (rows.length === 0) {
      logger.warn("No rows found to verify");
      return;
    }

    await Promise.all(
      rows.map(async (row, index) => {
        const element = row.locator(selector);
        await expect(element).toHaveCount(expectedCount);
        logger.info(`Row ${index + 1}: ${elementDescription} verified`);
      }),
    );
  }

  /**
   * Waits for the first table row to become visible, indicating that the table data has loaded.
   *
   * @returns {Promise<void>}
   */
  public async waitForFirstRowVisible(): Promise<void> {
    const firstRow = this.tableRows.first();
    await expect(firstRow).toBeVisible({ timeout: TimeoutManager.timeout(10000) });
    logger.debug("First table row is now visible");
  }

  /**
   * Checks if the first table row is currently visible.
   *
   * @returns {Promise<boolean>} True if visible, false otherwise
   */
  public async isFirstRowVisible(): Promise<boolean> {
    const firstRow = this.tableRows.first();
    try {
      await expect(firstRow).toBeVisible({ timeout: TimeoutManager.timeout(10000) });
      logger.debug("First table row is visible");
      return true;
    } catch (error) {
      ErrorHandler.captureError(error, "isFirstRowVisible", "Failed to check first row visibility");
      return false;
    }
  }

  /**
   * Checks if the first row of the table contains a "no results" message.
   *
   * @param noResultsTexts - Array of text patterns to check for
   * @returns {Promise<boolean>} True if a "no results" message is found, false otherwise
   */
  private async checkForNoResultsInFirstRow(noResultsTexts: string[]): Promise<boolean> {
    const firstRow = this.tableRows.first();
    return TableStabilityHelper.checkForNoResultsInFirstRow(firstRow, noResultsTexts);
  }

  /**
   * Counts the number of table rows currently in the DOM.
   * Note: This is a raw count and may include "no results" message rows.
   *
   * @returns {Promise<number>} The number of table rows
   */
  private async countTableRows(): Promise<number> {
    return this.tableRows.count();
  }
}
