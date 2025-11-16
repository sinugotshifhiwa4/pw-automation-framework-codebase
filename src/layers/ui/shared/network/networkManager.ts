import type { Page, Request, Response } from "@playwright/test";
import type { ResponseOptions, ModeOptions } from "../types/network.type.js";
import TimeoutManager from "../../../../config/timeouts/timeoutManager.js";
import ErrorHandler from "../../../../utils/errorHandling/errorHandler.js";
import logger from "../../../../config/logger/loggerManager.js";

export class NetworkManager {
  private readonly DEFAULT_STATUSES = [200, 201, 204];
  private readonly DEFAULT_TIMEOUT = TimeoutManager.timeout(30000, 1.5);

  /**
   * Waits for API response and navigation together
   * @param page - Playwright page instance
   * @param apiEndpoint - API endpoint to watch for
   * @param httpMethod - HTTP method (POST, PUT, DELETE, etc.)
   * @param navigationPattern - URL pattern to wait for
   * @param action - Action that triggers the API call
   * @param options - Configuration options
   * @returns The API response
   */
  public async waitForApiAndNavigation(
    page: Page,
    apiEndpoint: string,
    httpMethod: string,
    navigationPattern: string,
    action: () => Promise<void>,
    options: ResponseOptions = {},
  ): Promise<Response> {
    const {
      expectedStatuses = this.DEFAULT_STATUSES,
      timeout = this.DEFAULT_TIMEOUT,
      logResponseBody = false,
    } = options;

    try {
      const [response] = await Promise.all([
        page.waitForResponse(
          (res) => res.url().includes(apiEndpoint) && res.request().method() === httpMethod,
          { timeout },
        ),
        page.waitForURL(navigationPattern, { timeout }),
        action(),
      ]);

      await this.validateResponse(response, httpMethod, expectedStatuses, logResponseBody);

      return response;
    } catch (error) {
      const errorMessage = `Failed to wait for ${httpMethod} ${apiEndpoint} and navigate to ${navigationPattern}`;
      logger.error(errorMessage);
      ErrorHandler.captureError(error, "waitForApiAndNavigation", errorMessage);
      throw error;
    }
  }

  /**
   * Waits for an API response to complete.
   * Starts listening before triggering the action to catch fast responses.
   * @param page - Playwright page instance
   * @param apiEndpoint - API endpoint to watch for
   * @param httpMethod - HTTP method (POST, PUT, DELETE, etc.)
   * @param action - Action that triggers the API call
   * @param options - Configuration options
   * @returns The API response
   */
  public async waitForApiResponse(
    page: Page,
    apiEndpoint: string,
    httpMethod: string,
    action: () => Promise<void>,
    options: ResponseOptions = {},
  ): Promise<Response> {
    const {
      expectedStatuses = this.DEFAULT_STATUSES,
      additionalUrlCheck,
      timeout = this.DEFAULT_TIMEOUT,
      logResponseBody = false,
    } = options;

    try {
      const responsePromise = page.waitForResponse(
        (res) => {
          const url = res.url();
          const matchesEndpoint = url.includes(apiEndpoint);
          const matchesMethod = res.request().method() === httpMethod;
          const matchesAdditional = additionalUrlCheck ? additionalUrlCheck(url) : true;

          return matchesEndpoint && matchesMethod && matchesAdditional;
        },
        { timeout },
      );

      await action();
      const response = await responsePromise;

      // Validate status after receiving response
      if (!expectedStatuses.includes(response.status())) {
        const body = logResponseBody ? await this.safeReadBody(response) : "[not logged]";
        const errorMsg = `API ${httpMethod} ${apiEndpoint} returned unexpected status: ${response.status()}`;
        logger.error(`${errorMsg}\nResponse body: ${body}`);
        throw new Error(`${errorMsg} (expected: ${expectedStatuses.join(", ")})`);
      }

      logger.info(`${httpMethod} ${apiEndpoint} completed with status ${response.status()}`);

      if (logResponseBody) {
        const body = await this.safeReadBody(response);
        logger.debug(`Response body: ${body}`);
      }

      return response;
    } catch (error) {
      const errorMessage = `Failed to wait for ${httpMethod} ${apiEndpoint}`;
      logger.error(errorMessage);
      ErrorHandler.captureError(error, "waitForApiResponse", errorMessage);
      throw error;
    }
  }

  /**
   * Waits for multiple API responses in parallel
   * @param page - Playwright page instance
   * @param requests - Array of API request configurations
   * @param action - Action that triggers the API calls
   * @returns Array of API responses in the same order as requests
   */
  public async waitForMultipleApiResponses(
    page: Page,
    requests: Array<{
      endpoint: string;
      method: string;
      expectedStatuses?: number[];
    }>,
    action: () => Promise<void>,
  ): Promise<Response[]> {
    try {
      const responsePromises = requests.map((req) =>
        page.waitForResponse(
          (res) =>
            res.url().includes(req.endpoint) &&
            res.request().method() === req.method &&
            (req.expectedStatuses || this.DEFAULT_STATUSES).includes(res.status()),
        ),
      );

      await action();
      const responses = await Promise.all(responsePromises);

      responses.forEach((res, idx) => {
        logger.info(
          `${requests[idx].method} ${requests[idx].endpoint} completed with status ${res.status()}`,
        );
      });

      return responses;
    } catch (error) {
      ErrorHandler.captureError(
        error,
        "waitForMultipleApiResponses",
        "Failed to wait for multiple API responses",
      );
      throw error;
    }
  }

  /**
   * Enables network logging for the given page.
   * @param page - Page instance
   * @param options - Configuration options
   * @param options.mode - "off" | "continuous" | "one-time" (default: off)
   * @param options.filter - Optional URL filter function (default: none)
   */
  public setupNetworkLogging(page: Page, options: ModeOptions = {}): void {
    const { mode = "off", filter } = options;

    // Clean up existing listeners
    page.removeAllListeners("request");
    page.removeAllListeners("response");

    if (mode === "off") {
      logger.info("[NET] Network logging disabled");
      return;
    }

    const requestHandler = (req: Request) => {
      if (!filter || filter(req.url())) {
        logger.info(`[REQ] ${req.method()} ${req.url()}`);
      }
    };

    const responseHandler = (res: Response) => {
      if (!filter || filter(res.url())) {
        logger.info(`[RES] ${res.status()} ${res.url()}`);
      }
    };

    if (mode === "continuous") {
      page.on("request", requestHandler);
      page.on("response", responseHandler);
      logger.info("[NET] Continuous network logging enabled");
    } else {
      page.once("request", requestHandler);
      page.once("response", responseHandler);
      logger.info("[NET] One-time network logging enabled");
    }
  }

  /**
   * Validates response status against expected statuses
   */
  private async validateResponse(
    response: Response,
    httpMethod: string,
    expectedStatuses: number[],
    logResponseBody: boolean,
  ): Promise<void> {
    const status = response.status();

    if (!expectedStatuses.includes(status)) {
      const body = logResponseBody ? await this.safeReadBody(response) : "[not logged]";
      logger.error(`Failed ${httpMethod} request: ${status}\nResponse body: ${body}`);
      throw new Error(`Unexpected status ${status} (expected: ${expectedStatuses.join(", ")})`);
    }

    logger.info(`${httpMethod} request completed with status: ${status}`);
  }

  /**
   * Safely reads response body with error handling
   */
  private async safeReadBody(response: Response): Promise<string> {
    try {
      return await response.text();
    } catch {
      return "[unreadable]";
    }
  }
}
