import { test as baseTest, expect } from "@playwright/test";
import type { TestInfo } from "@playwright/test";

import { AsyncFileManager } from "../src/utils/fileManager/asyncFileManager.js";
import AuthenticationFileManager from "../src/config/authentication/storage/authenticationFileManager.js";
import AuthenticationSkipEvaluator from "../src/config/authentication/evaluator/authenticationSkipEvaluator.js";

import { EncryptionVariableResolver } from "../src/cryptography/encryptionProcessor/internal/encryptionVariableResolver.js";
import { VariableEncryptionExecutor } from "../src/cryptography/encryptionProcessor/internal/variableEncryptionExecutor.js";
import { EncryptionOperationLogger } from "../src/cryptography/encryptionProcessor/internal/encryptionOperationLogger.js";
import { EnvironmentFileEncryptor } from "../src/cryptography/encryptionProcessor/environmentFileEncryptor.js";
import { CryptoService } from "../src/cryptography/service/cryptoService.js";
import { CryptoCoordinator } from "../src/cryptography/service/cryptoCoordinator.js";

import { RuntimeEnvVariableResolver } from "../src/config/environment/runtimeVariableResolver/runtimeEnvVariableResolver.js";

type TestFixtures = {
  /**
   * Determines if authentication state should be saved for the test
   */
  shouldSaveAuthenticationState: boolean;

  /**
   * Playwright TestInfo object
   */
  testInfo: TestInfo;

  // Crypto
  encryptionVariableResolver: EncryptionVariableResolver;
  variableEncryptionExecutor: VariableEncryptionExecutor;
  encryptionOperationLogger: EncryptionOperationLogger;
  environmentFileEncryptor: EnvironmentFileEncryptor;
  cryptoService: CryptoService;
  cryptoCoordinator: CryptoCoordinator;

  runtimeEnvVariableResolver: RuntimeEnvVariableResolver;
};

export const test = baseTest.extend<TestFixtures>({
  shouldSaveAuthenticationState: [true, { option: true }],
  testInfo: async ({}, use, testInfo: TestInfo) => {
    await use(testInfo);
  },

  // Crypto
  encryptionVariableResolver: async ({}, use) => {
    await use(new EncryptionVariableResolver());
  },
  variableEncryptionExecutor: async ({}, use) => {
    await use(new VariableEncryptionExecutor());
  },
  encryptionOperationLogger: async ({}, use) => {
    await use(new EncryptionOperationLogger());
  },
  environmentFileEncryptor: async (
    { encryptionVariableResolver, variableEncryptionExecutor },
    use,
  ) => {
    await use(new EnvironmentFileEncryptor(encryptionVariableResolver, variableEncryptionExecutor));
  },
  cryptoService: async ({}, use) => {
    await use(new CryptoService());
  },
  cryptoCoordinator: async ({ environmentFileEncryptor }, use) => {
    await use(new CryptoCoordinator(environmentFileEncryptor));
  },

  runtimeEnvVariableResolver: async ({}, use) => {
    await use(new RuntimeEnvVariableResolver());
  },

  /**
   * Provides the storage state file path for browser authentication persistence.
   *
   * Returns the path to saved authentication state when:
   * - Authentication state persistence is enabled
   * - The test requires authentication (not skipped)
   * - A saved state file exists
   *
   * Otherwise returns undefined to start a fresh browser session.
   *
   * @param shouldSaveAuthenticationState - Flag indicating whether to persist auth state
   * @param testInfo - Playwright test metadata for filtering
   * @param use - Playwright fixture function to provide the storage state value
   */
  storageState: async ({ shouldSaveAuthenticationState, testInfo }, use) => {
    // Check if this test should skip authentication (e.g., "Invalid Credentials" tests)
    const shouldSkipAuthentication = AuthenticationSkipEvaluator.shouldSkipAuthenticationIfNeeded(
      testInfo,
      ["Invalid Credentials"],
    );

    // Use saved authentication state if enabled and not skipped
    if (shouldSaveAuthenticationState && !shouldSkipAuthentication) {
      const storagePath = AuthenticationFileManager.getFilePath();
      const fileExists = await AsyncFileManager.doesFileExist(storagePath);

      await use(fileExists ? storagePath : undefined);
    } else {
      await use(undefined);
    }
  },
});

export { expect };
