import { defineConfig, devices } from "@playwright/test";
import { TIMEOUTS } from "./src/config/timeouts/timeout.config.js";
import EnvironmentDetector from "./src/config/environment/detector/environmentDetector.js";
import { shouldSkipBrowserInit } from "./src/utils/shared/skipBrowserInitFlag.js";
import WorkerAllocator from "./src/config/cpuAllocator/workerAllocator.js";

const isCI = EnvironmentDetector.isCI();
const skipBrowserInit = shouldSkipBrowserInit();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  timeout: TIMEOUTS.test,
  expect: {
    timeout: TIMEOUTS.expect,
  },
  testDir: "./tests",
  globalSetup: "./src/config/environment/global/globalSetup.ts",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: WorkerAllocator.getOptimalWorkerCount("10-percent"),
  /**
   * Configures Playwright reporters and test filtering behavior.
   *
   * - In CI environments: generates only a blob report for aggregation and uploads.
   * - In local runs: generates multiple reports (HTML and line) for easier debugging and visualization.
   *
   */
  reporter: isCI
    ? [["blob", { outputDir: "blob-report", alwaysReport: true }]]
    : [["html", { open: "never" }], ["line"]],
  /**
   * The `grep` option enables running tests by tag or keyword.
   * You can set the `PLAYWRIGHT_GREP` environment variable (e.g., `@regression`, `@sanity`) to filter which tests run.
   */
  grep:
    typeof process.env.PLAYWRIGHT_GREP === "string"
      ? new RegExp(process.env.PLAYWRIGHT_GREP)
      : process.env.PLAYWRIGHT_GREP || /.*/,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /**
     * Test artifacts & browser mode.
     * - In CI: optimize for performance and smaller artifacts.
     * - In local dev: maximize visibility for debugging.
     */
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "on",
    headless: isCI ? true : false,

    /**
     * Browser launch options:
     * - In Jenkins CI with GPU-enabled workers, enable GPU acceleration.
     * - Locally, you can leave it default for simplicity.
     */
    launchOptions: {
      args: isCI
        ? [
            "--no-sandbox",
            "--disable-dev-shm-usage",
            "--enable-features=VaapiVideoDecoder",
            "--enable-gpu-rasterization",
            "--enable-zero-copy",
            "--ignore-gpu-blocklist",
            "--use-gl=egl",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
            "--disable-extensions",
            "--disable-plugins",
            "--no-first-run",
            "--disable-default-apps",
            "--disable-translate",
          ]
        : [],
    },
  },

  /* Configure projects for major browsers */
  projects: [
    /**
     * Setup project to initialize browser context if not skipped.
     * This is useful for scenarios where multiple tests share the same
     * browser context setup (e.g., authentication) to save time.
     * If browser initialization is skipped, this authentication setup is also skipped.
     */
    ...(!skipBrowserInit
      ? [
          {
            name: "setup",
            use: { ...devices["Desktop Chrome"] },
            testMatch: /.*\.setup\.ts/,
          },
        ]
      : []),
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: undefined,
      },
      dependencies: skipBrowserInit ? [] : ["setup"],
    },
    // {
    //   name: "chromium",
    //   use: { ...devices["Desktop Chrome"] },
    // },

    // {
    //   name: "firefox",
    //   use: { ...devices["Desktop Firefox"] },
    // },

    // {
    //   name: "webkit",
    //   use: { ...devices["Desktop Safari"] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
