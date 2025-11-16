import * as crypto from "crypto";
import CryptoWebOperations from "./cryptoWebOperations.js";
import { FileEncoding } from "../../../utils/fileManager/internal/file-encoding.enum.js";
import ErrorHandler from "../../../utils/errorHandling/errorHandler.js";

export default class CryptoHmac {
  /**
   * Consolidated method for preparing HMAC data from components
   * Used by both encryption and decryption operations
   * Returns Uint8Array for Web Crypto API compatibility
   */
  public static prepareHMACData(salt: string, iv: string, cipherText: string): Uint8Array {
    const saltBuffer = Buffer.from(salt, FileEncoding.BASE64);
    const ivBuffer = Buffer.from(iv, FileEncoding.BASE64);
    const cipherBuffer = Buffer.from(cipherText, FileEncoding.BASE64);

    const concatenated = Buffer.concat([saltBuffer, ivBuffer, cipherBuffer]);
    return new Uint8Array(concatenated);
  }

  /**
   * Verifies HMAC integrity for the provided data components
   * Computes HMAC using Web Crypto API and compares it with the received HMAC
   * @param salt - The base64 encoded salt value
   * @param iv - The base64 encoded initialization vector
   * @param cipherText - The base64 encoded ciphertext
   * @param receivedHmac - The base64 encoded HMAC value
   * @param hmacKey - The CryptoKey for HMAC computation
   * @throws {Error} - If the HMACs do not match
   */
  public static async verifyHMACIntegrity(
    salt: string,
    iv: string,
    cipherText: string,
    receivedHmac: string,
    hmacKey: crypto.webcrypto.CryptoKey,
  ): Promise<void> {
    try {
      // Prepare data in the same format used when the HMAC was originally generated
      const dataToHmac = this.prepareHMACData(salt, iv, cipherText);

      // Compute HMAC for the received data using the derived hmacKey
      const computedHmac = await CryptoWebOperations.computeHMAC(hmacKey, dataToHmac);

      // Constant-time compare the computed and received HMACs
      const isValid = this.verifyHMAC(computedHmac, receivedHmac);
      if (!isValid) {
        ErrorHandler.logAndThrow(
          "CryptoEngine.verifyHMACIntegrity",
          "Authentication failed: HMAC mismatch — invalid key or tampered data",
        );
      }
    } catch (error) {
      ErrorHandler.captureError(error, "verifyHMACIntegrity", "Failed to verify HMAC integrity");
      throw error;
    }
  }

  /**
   * Verifies HMAC integrity using constant-time comparison.
   */
  private static verifyHMAC(computedHmac: string, receivedHmac: string): boolean {
    const computed = Buffer.from(computedHmac, FileEncoding.BASE64);
    const received = Buffer.from(receivedHmac, FileEncoding.BASE64);

    if (computed.length !== received.length) return false;

    return crypto.timingSafeEqual(computed, received);
  }
}
