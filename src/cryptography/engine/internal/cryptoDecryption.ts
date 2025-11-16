import * as crypto from "crypto";
import CryptoWebOperations from "./cryptoWebOperations.js";
//import CryptoHmac from "./cryptoHmac.js";
import { CRYPTO_CONSTANTS } from "../../types/crypto.config.js";
import CryptoValidation from "./cryptoValidation.js";
import { FileEncoding } from "../../../utils/fileManager/internal/file-encoding.enum.js";
import ErrorHandler from "../../../utils/errorHandling/errorHandler.js";

export default class CryptoDecryption {
  /**
   * Consolidated validation for encrypted data components
   * Combines format, part count, required parts, and base64 validation
   */
  private static validateEncryptedComponents(
    encryptedData: string,
    parts: string[],
    version: string,
    salt: string,
    iv: string,
    cipherText: string,
    receivedHmac: string,
  ): void {
    const expectedParts = CRYPTO_CONSTANTS.FORMAT.EXPECTED_PARTS + 1;

    if (!encryptedData.startsWith(CRYPTO_CONSTANTS.FORMAT.PREFIX)) {
      ErrorHandler.logAndThrow(
        "CryptoEngine.validateEncryptedComponents",
        "Invalid encrypted format: Missing prefix",
      );
    }

    if (parts.length !== expectedParts) {
      ErrorHandler.logAndThrow(
        "CryptoEngine.validateEncryptedComponents",
        `Invalid format. Expected ${expectedParts} parts, got ${parts.length}`,
      );
    }

    if (version !== CRYPTO_CONSTANTS.FORMAT.VERSION) {
      ErrorHandler.logAndThrow(
        "CryptoEngine.validateEncryptedComponents",
        `Unsupported encryption version: ${version}`,
      );
    }

    const missingParts = [];
    if (!salt) missingParts.push("salt");
    if (!iv) missingParts.push("iv");
    if (!cipherText) missingParts.push("cipherText");
    if (!receivedHmac) missingParts.push("hmac");

    if (missingParts.length > 0) {
      ErrorHandler.logAndThrow(
        "CryptoEngine.validateEncryptedComponents",
        `Missing components - ${missingParts.join(", ")}`,
      );
    }

    const invalidComponents = [];
    if (!CryptoValidation.isValidBase64(salt)) invalidComponents.push("salt");
    if (!CryptoValidation.isValidBase64(iv)) invalidComponents.push("iv");
    if (!CryptoValidation.isValidBase64(cipherText)) invalidComponents.push("cipherText");
    if (!CryptoValidation.isValidBase64(receivedHmac)) invalidComponents.push("hmac");

    if (invalidComponents.length > 0) {
      ErrorHandler.logAndThrow(
        "CryptoEngine.validateEncryptedComponents",
        `Invalid format for components: ${invalidComponents.join(", ")}`,
      );
    }
  }

  /**
   * Parses an encrypted data string into its individual components:
   * version, salt, initialization vector (IV), ciphertext, and HMAC.
   * Validates the format of the input string and throws an error if it is invalid.
   * @param encryptedData The encrypted data string to parse
   * @returns An object containing the parsed components
   */
  public static parseEncryptedData(encryptedData: string): {
    version: string;
    salt: string;
    iv: string;
    cipherText: string;
    receivedHmac: string;
  } {
    const encryptedPart = encryptedData.substring(CRYPTO_CONSTANTS.FORMAT.PREFIX.length);
    const parts = encryptedPart.split(CRYPTO_CONSTANTS.FORMAT.SEPARATOR);
    const [version, salt, iv, cipherText, receivedHmac] = parts;

    if (!version || !salt || !iv || !cipherText || !receivedHmac) {
      ErrorHandler.logAndThrow("CryptoEngine.parseEncryptedData", "Invalid encrypted data format");
    }

    this.validateEncryptedComponents(
      encryptedData,
      parts,
      version,
      salt,
      iv,
      cipherText,
      receivedHmac,
    );

    return { version, salt, iv, cipherText, receivedHmac };
  }

  /**
   * Performs decryption using Web Crypto API
   * Converts base64 strings to Uint8Array for Web Crypto compatibility
   * NOTE: Call validateHMAC() before calling this method!
   */
  public static async performDecryption(
    iv: string,
    encryptionKey: crypto.webcrypto.CryptoKey,
    cipherText: string,
  ): Promise<ArrayBuffer> {
    const ivBuffer = new Uint8Array(Buffer.from(iv, FileEncoding.BASE64));
    const cipherBuffer = new Uint8Array(Buffer.from(cipherText, FileEncoding.BASE64));

    return await CryptoWebOperations.decryptBuffer(ivBuffer, encryptionKey, cipherBuffer);
  }
}
