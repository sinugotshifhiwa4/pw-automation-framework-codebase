import { CRYPTO_CONSTANTS } from "../../types/crypto.config.js";
import { FileEncoding } from "../../../utils/fileManager/internal/file-encoding.enum.js";
import ErrorHandler from "../../../utils/errorHandling/errorHandler.js";

export default class CryptoValidation {
  /**
   * Validates whether a given value is an encrypted string following the format:
   * "ENC2:v1:<salt>:<iv>:<cipherText>:<hmac>"
   * @param value - The string to validate
   * @returns True if the value is an encrypted string, false otherwise
   */
  public static isEncrypted(value: string): boolean {
    try {
      if (!value || typeof value !== "string") return false;
      if (!value.startsWith(CRYPTO_CONSTANTS.FORMAT.PREFIX)) return false;

      const parts = value
        .replace(CRYPTO_CONSTANTS.FORMAT.PREFIX, "")
        .split(CRYPTO_CONSTANTS.FORMAT.SEPARATOR);

      // Now expect version + 4 parts = 5
      if (parts.length !== CRYPTO_CONSTANTS.FORMAT.EXPECTED_PARTS + 1) return false;

      const [version, ...cryptoParts] = parts;
      if (version !== CRYPTO_CONSTANTS.FORMAT.VERSION) return false;

      return cryptoParts.every((part) => this.isValidBase64(part));
    } catch {
      return false;
    }
  }

  /**
   * Validates a base64-encoded string.
   * Throws an error if the string is empty, not a string, or not a valid base64 string.
   * @param {string} value - The base64-encoded string to validate.
   * @returns {boolean} - Whether the string is a valid base64 string.
   */
  public static isValidBase64(value: string): boolean {
    if (!value || typeof value !== "string") {
      return false;
    }

    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(value) || value.length % 4 !== 0) {
      return false;
    }

    try {
      Buffer.from(value, FileEncoding.BASE64);
      return true;
    } catch (error) {
      ErrorHandler.captureError(error, "isValidBase64", "Failed to validate base64 string");
      return false;
    }
  }

  /**
   * Validates a base64-encoded string.
   * Throws an error if the string is empty, not a string, or not a valid base64 string.
   * @param {string} value - The base64-encoded string to validate.
   * @param {string} fieldName - The name of the field being validated.
   */
  public static validateBase64String(value: string, fieldName: string): void {
    if (!value || typeof value !== "string") {
      ErrorHandler.logAndThrow(
        "CryptoEngine.validateBase64String",
        `${fieldName} must be a non-empty string`,
      );
    }

    if (!this.isValidBase64(value)) {
      ErrorHandler.logAndThrow("validateBase64String", `${fieldName} is not a valid base64 string`);
    }
  }

  /**
   * Validates that a secret key is not empty and has a minimum length of 16 characters
   * @param secretKey - The secret key to validate
   * @throws {Error} If the secret key is invalid
   */
  public static validateSecretKey(secretKey: string): void {
    if (!secretKey || typeof secretKey !== "string") {
      ErrorHandler.logAndThrow(
        "CryptoEngine.validateSecretKey",
        "Secret key must be a non-empty string",
      );
    }

    if (secretKey.length < 16) {
      ErrorHandler.logAndThrow(
        "validateSecretKey",
        `Secret key must be at least 16 characters long`,
      );
    }
  }

  /**
   * Validates the inputs for a given operation (encrypt/decrypt)
   * Ensures both the value and secret key are non-empty strings
   * @param value - The plaintext string to encrypt or decrypt
   * @param secretKey - The secret key variable to use for encryption/decryption
   * @param operation - The operation name (encrypt/decrypt) for error context
   */
  public static validateInputs(value: string, secretKey: string, operation: string): void {
    if (!value || typeof value !== "string") {
      ErrorHandler.logAndThrow(
        "CryptoEngine.validateInputs",
        `${operation}: Value must be a non-empty string`,
      );
    }
    if (!secretKey || typeof secretKey !== "string") {
      ErrorHandler.logAndThrow(
        "validateSecretKey",
        `${operation}: Secret key must be a non-empty string`,
      );
    }
  }
}
