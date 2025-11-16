import * as crypto from "crypto";
import { CRYPTO_CONSTANTS } from "../../types/crypto.config.js";
import { FileEncoding } from "../../../utils/fileManager/internal/file-encoding.enum.js";
import ErrorHandler from "../../../utils/errorHandling/errorHandler.js";

export default class CryptoWebOperations {
  // TextEncoder instance for encoding strings to Uint8Array
  private static textEncoder = new TextEncoder();

  /**
   * Computes HMAC using Web Crypto API
   * @param key The CryptoKey for HMAC
   * @param data The data buffer to sign
   * @returns Base64-encoded HMAC signature
   */
  public static async computeHMAC(
    key: crypto.webcrypto.CryptoKey,
    data: Uint8Array,
  ): Promise<string> {
    try {
      const signature = await crypto.webcrypto.subtle.sign("HMAC", key, data);
      return Buffer.from(signature).toString(FileEncoding.BASE64);
    } catch (error) {
      ErrorHandler.captureError(error, "computeHMAC", "Failed to compute HMAC.");
      throw error;
    }
  }

  /**
   * Performs a constant-time comparison of two base64-encoded strings
   * using the Node.js crypto.timingSafeEqual() method.
   * This method is used to compare HMAC signatures without exposing
   * timing information that could potentially be exploited by an attacker.
   * @param firstValue - The first value to compare
   * @param secondValue - The second value to compare
   * @returns true if the values match, false otherwise
   */
  public static constantTimeCompare(firstValue: string, secondValue: string): boolean {
    if (!firstValue || !secondValue) return false;

    try {
      const computed = Buffer.from(firstValue, FileEncoding.BASE64);
      const received = Buffer.from(secondValue, FileEncoding.BASE64);

      if (computed.length !== received.length) return false;
      if (computed.length === 0) return false; // avoid timingSafeEqual with zero-length buffers

      return crypto.timingSafeEqual(computed, received);
    } catch (error) {
      ErrorHandler.captureError(error, "constantTimeCompare", "Failed constant-time comparison");
      return false;
    }
  }

  /**
   * Encrypts data using Web Crypto API with AES-GCM
   * @param iv The initialization vector as Uint8Array
   * @param key The CryptoKey for encryption
   * @param value The plaintext string to encrypt
   * @returns Encrypted data as ArrayBuffer
   */
  public static async encryptBuffer(
    iv: Uint8Array,
    key: crypto.webcrypto.CryptoKey,
    value: string,
  ): Promise<ArrayBuffer> {
    try {
      return await crypto.webcrypto.subtle.encrypt(
        {
          name: CRYPTO_CONSTANTS.ALGORITHM.CIPHER,
          iv: iv,
        },
        key,
        CryptoWebOperations.textEncoder.encode(value),
      );
    } catch (error) {
      ErrorHandler.captureError(error, "encryptBuffer", "Failed to encrypt with AES-GCM.");
      throw error;
    }
  }

  /**
   * Decrypts data using Web Crypto API with AES-GCM
   * @param iv The initialization vector as Uint8Array
   * @param key The CryptoKey for decryption
   * @param cipherBuffer The encrypted data as Uint8Array
   * @returns Decrypted data as ArrayBuffer
   */
  public static async decryptBuffer(
    iv: Uint8Array,
    key: crypto.webcrypto.CryptoKey,
    cipherBuffer: Uint8Array,
  ): Promise<ArrayBuffer> {
    try {
      return await crypto.webcrypto.subtle.decrypt(
        {
          name: CRYPTO_CONSTANTS.ALGORITHM.CIPHER,
          iv: iv,
        },
        key,
        cipherBuffer,
      );
    } catch (error) {
      const errorAsError = error as Error;
      ErrorHandler.captureError(
        error,
        "decryptBuffer",
        `Failed to decrypt with AES-GCM, message: ${errorAsError.message}`,
      );
      throw error;
    }
  }

  /**
   * Imports a key for AES-GCM encryption/decryption using Web Crypto API
   */
  public static async importKeyForCrypto(keyBuffer: Buffer): Promise<crypto.webcrypto.CryptoKey> {
    try {
      return await crypto.webcrypto.subtle.importKey(
        "raw",
        keyBuffer,
        { name: CRYPTO_CONSTANTS.ALGORITHM.CIPHER },
        false,
        CRYPTO_CONSTANTS.ALGORITHM.KEY_USAGE,
      );
    } catch (error) {
      ErrorHandler.captureError(
        error,
        "importKeyForCrypto",
        "Failed to import key for Web Crypto API.",
      );
      throw error;
    }
  }

  /**
   * Imports a key for HMAC operations using Web Crypto API
   */
  public static async importKeyForHMAC(keyBuffer: Buffer): Promise<crypto.webcrypto.CryptoKey> {
    try {
      return await crypto.webcrypto.subtle.importKey(
        "raw",
        keyBuffer,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"],
      );
    } catch (error) {
      ErrorHandler.captureError(error, "importKeyForHMAC", "Failed to import key for HMAC.");
      throw error;
    }
  }
}
