import { CRYPTO_CONSTANTS } from "../../types/crypto.config.js";

export default class EncryptionUtils {
  /**
   * Checks whether the provided value is already encrypted.
   * It verifies both the prefix and version pattern, e.g. "ENC2:v1:".
   */
  public static isAlreadyEncrypted(value: string): boolean {
    if (!value) return false;

    const { PREFIX, VERSION } = CRYPTO_CONSTANTS.FORMAT;
    const fullMarker = `${PREFIX}${VERSION}:`;

    return value.startsWith(fullMarker);
  }

  /**
   * Trims the given value if it is a string and returns an empty string if it is null or undefined.
   * @param {string | null | undefined} value - The value to trim.
   * @returns {string} The trimmed value or an empty string if the value is null or undefined.
   */
  public static trimSafely(value: string | null | undefined): string {
    return value?.trim() || "";
  }

  /**
   * Logs a message if the provided array of items is not empty.
   * Useful for conditionally logging information if the given array is populated.
   * @param {string[]} items - The array of items to log.
   * @param {(items: string[]) => void} logFn - The function to call with the items array as a parameter.
   */
  public static logIfNotEmpty(items: string[], logFn: (items: string[]) => void): void {
    if (items.length > 0) {
      logFn(items);
    }
  }
}
