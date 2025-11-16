import type { TestInfo } from "@playwright/test";
import ErrorHandler from "../../../utils/errorHandling/errorHandler.js";

export default class AuthenticationSkipEvaluator {
  /**
   * Determines if authentication should be skipped for a test.
   *
   * @param testInfo - Playwright TestInfo object
   * @param skipConditions - Array of strings to check against test title
   * @returns `true` if authentication setup should be skipped, otherwise `false`
   */
  public static shouldSkipAuthenticationIfNeeded(
    testInfo: TestInfo,
    skipConditions: string[],
  ): boolean {
    try {
      if (!testInfo?.title) {
        return false;
      }

      const testTitle = testInfo.title.trim().toLowerCase();

      const normalizedConditions = skipConditions.map((condition) =>
        condition.trim().toLowerCase(),
      );

      // Check if title matches any skip conditions
      return normalizedConditions.some((condition) => testTitle.includes(condition));
    } catch (error) {
      ErrorHandler.captureError(
        error,
        "shouldSkipAuthenticationIfNeeded",
        `Failed to determine if authentication should be skipped for test: ${testInfo?.title || "unknown"}`,
      );
      return false;
    }
  }
}
