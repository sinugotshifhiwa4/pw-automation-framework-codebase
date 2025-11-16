import * as argon2 from "argon2";
import * as crypto from "crypto";
import CryptoValidation from "./cryptoValidation.js";
import CryptoWebOperations from "./cryptoWebOperations.js";
import { CRYPTO_CONFIG } from "../../types/crypto.config.js";
import { FileEncoding } from "../../../utils/fileManager/internal/file-encoding.enum.js";
import ErrorHandler from "../../../utils/errorHandling/errorHandler.js";

export default class CryptoArgon2 {
  /**
   * Derives two cryptographic keys using Argon2 hashing algorithm.
   * The two keys are used for encryption and HMAC verification.
   * @param secretKey - The secret key to derive the keys from
   * @param salt - The salt value to use with the Argon2 hashing algorithm
   * @returns A Promise resolving to an object containing the derived encryption and HMAC keys
   */
  public static async deriveKeysWithArgon2(
    secretKey: string,
    salt: string,
  ): Promise<{
    encryptionKey: crypto.webcrypto.CryptoKey;
    hmacKey: crypto.webcrypto.CryptoKey;
  }> {
    try {
      CryptoValidation.validateBase64String(salt, "salt");

      const saltBuffer = Buffer.from(salt, FileEncoding.BASE64);

      const options: argon2.Options = {
        type: argon2.argon2id,
        hashLength:
          CRYPTO_CONFIG.BYTE_LENGTHS.SECRET_KEY + CRYPTO_CONFIG.BYTE_LENGTHS.HMAC_KEY_LENGTH,
        salt: saltBuffer,
        memoryCost: CRYPTO_CONFIG.ARGON2_PARAMETERS.MEMORY_COST,
        timeCost: CRYPTO_CONFIG.ARGON2_PARAMETERS.TIME_COST,
        parallelism: CRYPTO_CONFIG.ARGON2_PARAMETERS.PARALLELISM,
      };

      const derivedKeyBuffer = await this.argon2Hashing(secretKey, options);

      const encryptionKeyBuffer = derivedKeyBuffer.subarray(
        0,
        CRYPTO_CONFIG.BYTE_LENGTHS.SECRET_KEY,
      );
      const hmacKeyBuffer = derivedKeyBuffer.subarray(CRYPTO_CONFIG.BYTE_LENGTHS.SECRET_KEY);

      const encryptionKey = await CryptoWebOperations.importKeyForCrypto(
        Buffer.from(encryptionKeyBuffer),
      );
      const hmacKey = await CryptoWebOperations.importKeyForHMAC(Buffer.from(hmacKeyBuffer));

      return { encryptionKey, hmacKey };
    } catch (error) {
      ErrorHandler.captureError(error, "deriveKeysWithArgon2", "Failed to derive keys.");
      throw error;
    }
  }

  /**
   * Performs Argon2 hashing on the given secret key with the provided options
   * @param secretKey - The secret key to hash
   * @param options - The options object for Argon2 hashing
   * @returns A Promise resolving to a Buffer containing the hashed secret key
   * @throws If the hashing fails
   */
  private static async argon2Hashing(secretKey: string, options: argon2.Options): Promise<Buffer> {
    try {
      return await argon2.hash(secretKey, {
        ...options,
        raw: true,
      });
    } catch (error) {
      ErrorHandler.captureError(
        error,
        "argon2Hashing",
        "Failed to derive key using Argon2 hashing.",
      );
      throw error;
    }
  }
}
