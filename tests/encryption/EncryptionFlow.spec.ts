import { test, expect } from "../../fixtures/test.fixtures.js";
import EncryptionValidator from "../../src/cryptography/encryptionProcessor/validator/encryptionValidator.js";
import logger from "../../src/config/logger/loggerManager.js";

test.describe.serial("Encryption Flow @encryption-flow", () => {
  test("should generate secret key", async ({ cryptoCoordinator }) => {
    const secretKey = await cryptoCoordinator.generateAndStoreSecretKey();

    expect(secretKey).toBeTruthy();
    expect(secretKey.length).toBeGreaterThan(0);

    logger.info("Verified: Secret key generated successfully");
  });

  test("should encrypt environment variables", async ({ cryptoCoordinator }) => {
    const variablesToEncrypt = ["PORTAL_USERNAME", "PORTAL_PASSWORD"];

    await cryptoCoordinator.encryptEnvironmentVariables(variablesToEncrypt);
    await EncryptionValidator.validateEncryption(variablesToEncrypt);

    logger.info("Verified: Environment variables encrypted successfully");
  });
});
