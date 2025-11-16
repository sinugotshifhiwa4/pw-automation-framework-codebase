import type { Locator } from "@playwright/test";
import { expect } from "@playwright/test";
import logger from "../../../../../config/logger/loggerManager.js";
import ErrorHandler from "../../../../../utils/errorHandling/errorHandler.js";
import type { TableRowCountResult } from "../../types/tableManager.type.js";

/**
 * Helper class for table stability operations and "no results" detection.
 * Handles the low-level logic for polling, stability checking, and message detection.
 */
export class TableStabilityHelper {
  public static readonly DEFAULT_MAX_ATTEMPTS = 6;
  public static readonly DEFAULT_STABILITY_THRESHOLD = 3;
  public static readonly DEFAULT_DELAY_MS = 800;
  public static readonly DEFAULT_NO_RESULTS_TEXTS = [
    "no results found",
    "no data available",
    "no records found",
    "no items to display",
  ];

  /**
   * Waits for the table row count to stabilize to the same value for a given number of consecutive attempts.
   * This handles cases where the table row count may fluctuate during loading.
   *
   * @param countTableRowsFn - Function to count table rows
   * @param checkForNoResultsFn - Function to check for "no results" message
   * @param maxAttempts - Maximum number of attempts to wait for stability
   * @param stabilityThreshold - Number of consecutive attempts required to determine stability
   * @param delayMs - Time in milliseconds to wait between poll attempts
   * @param noResultsTexts - Array of text patterns to check for "no results" scenarios
   * @returns {Promise<TableRowCountResult | null>} Result object with count and no-results flag, or null if stability could not be achieved
   */
  public static async waitForStableRowCountPoll(
    countTableRowsFn: () => Promise<number>,
    checkForNoResultsFn: (noResultsTexts: string[]) => Promise<boolean>,
    maxAttempts: number,
    stabilityThreshold: number,
    delayMs: number,
    noResultsTexts: string[],
  ): Promise<TableRowCountResult | null> {
    try {
      const countHistory: number[] = [];
      let stableResult: TableRowCountResult | undefined;

      await expect
        .poll(
          async () => {
            const currentCount = await countTableRowsFn();
            countHistory.push(currentCount);

            logger.debug(`Poll attempt ${countHistory.length}: Current count=${currentCount}`);

            // Check for stability first
            if (this.hasStability(countHistory, stabilityThreshold)) {
              const stableCount = currentCount;

              // If stable at 1 row, check if it's a "no results" message
              if (stableCount === 1) {
                const isNoResults = await checkForNoResultsFn(noResultsTexts);

                if (isNoResults) {
                  logger.info("Detected stable 'no results' message. Treating as 0 data rows.");
                  stableResult = { count: 0, isNoResultsMessage: true };
                  return stableResult;
                }
              }

              logger.debug(
                `Stability achieved! Count ${stableCount} maintained for ${stabilityThreshold} consecutive attempts`,
              );
              stableResult = { count: stableCount, isNoResultsMessage: false };
              return stableResult;
            }

            return undefined;
          },
          {
            timeout: maxAttempts * delayMs,
            intervals: Array(maxAttempts).fill(delayMs),
          },
        )
        .not.toBeUndefined();

      return stableResult ?? null;
    } catch (error) {
      const finalCount = await countTableRowsFn().catch(() => null);
      ErrorHandler.captureError(
        error,
        "waitForStableRowCountPoll",
        `Polling stability failed after ${maxAttempts} attempts. Fallback count: ${finalCount}`,
      );

      return null;
    }
  }

  /**
   * Determines if the table row count has stabilized to the same value for
   * a given number of consecutive attempts.
   *
   * @param countHistory - Array of table row counts from polling attempts
   * @param stabilityThreshold - Number of consecutive attempts required to determine stability
   * @returns {boolean} True if stable, false otherwise
   */
  public static hasStability(countHistory: number[], stabilityThreshold: number): boolean {
    if (countHistory.length < stabilityThreshold) {
      return false;
    }

    const recentCounts = countHistory.slice(-stabilityThreshold);
    return recentCounts.every((count) => count === recentCounts[0]);
  }

  /**
   * Checks if the first row of the table contains a "no results" message.
   *
   * @param firstRow - Locator for the first table row
   * @param noResultsTexts - Array of text patterns to check for
   * @returns {Promise<boolean>} True if a "no results" message is found, false otherwise
   */
  public static async checkForNoResultsInFirstRow(
    firstRow: Locator,
    noResultsTexts: string[],
  ): Promise<boolean> {
    try {
      const rowText = await firstRow.textContent();

      if (!rowText) {
        return false;
      }

      const normalizedText = rowText.toLowerCase().trim();

      const hasNoResultsMessage = noResultsTexts.some((pattern) => {
        const normalizedPattern = pattern.toLowerCase();
        return normalizedText.includes(normalizedPattern);
      });

      if (hasNoResultsMessage) {
        logger.debug(`No results message detected in first row: "${rowText.substring(0, 50)}..."`);
        return true;
      }

      return false;
    } catch (error) {
      logger.warn("Failed to check first row for no results message", error);
      return false;
    }
  }
}
