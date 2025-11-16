import * as crypto from "crypto";
import SecureKeyGenerator from "../../key/secureKeyGenerator.js";
import CryptoArgon2 from "./cryptoArgon2.js";
import CryptoEnvironment from "./cryptoEnvironment.js";
import CryptoWebOperations from "./cryptoWebOperations.js";
import CryptoHmac from "./cryptoHmac.js";
import { CRYPTO_CONSTANTS } from "../../types/crypto.config.js";
import CryptoValidation from "./cryptoValidation.js";
import { FileEncoding } from "../../../utils/fileManager/internal/file-encoding.enum.js";

export default class CryptoEncryption {
  /**
   * Validates the prerequisites for encryption
   * Ensures the secret key variable is resolvable and the value is not empty
   * @param value - The value to encrypt
   * @param secretKeyVariable - The secret key variable to use for encryption
   * @returns The actual secret key used for encryption
   */
  public static async validateEncryptionPrerequisites(
    value: string,
    secretKeyVariable: string,
  ): Promise<string> {
    const actualSecretKey = await CryptoEnvironment.getSecretKeyFromEnvironment(secretKeyVariable);
    CryptoValidation.validateSecretKey(actualSecretKey);
    CryptoValidation.validateInputs(value, actualSecretKey, "encrypt");
    return actualSecretKey;
  }

  /**
   * Generates all components needed for encryption
   * Returns Web Crypto API compatible types
   */
  public static async generateEncryptionComponents(secretKey: string): Promise<{
    salt: string;
    iv: Uint8Array;
    encryptionKey: crypto.webcrypto.CryptoKey;
    hmacKey: crypto.webcrypto.CryptoKey;
  }> {
    const salt = SecureKeyGenerator.generateBase64Salt();
    const iv = SecureKeyGenerator.generateWebCryptoIV();

    const { encryptionKey, hmacKey } = await CryptoArgon2.deriveKeysWithArgon2(secretKey, salt);

    return {
      salt,
      iv,
      encryptionKey,
      hmacKey,
    };
  }

  /**
   * Formats the encrypted payload in the following format:
   * "ENC2:v1:<salt>:<iv>:<cipherText>:<hmac>"
   * @param salt - The base64 encoded salt value
   * @param iv - The base64 encoded initialization vector
   * @param cipherText - The base64 encoded ciphertext
   * @param hmac - The base64 encoded HMAC value
   * @returns The formatted encrypted payload string
   */
  private static formatEncryptedPayload(
    salt: string,
    iv: string,
    cipherText: string,
    hmac: string,
  ): string {
    const { PREFIX, VERSION, SEPARATOR } = CRYPTO_CONSTANTS.FORMAT;
    return `${PREFIX}${VERSION}${SEPARATOR}${salt}${SEPARATOR}${iv}${SEPARATOR}${cipherText}${SEPARATOR}${hmac}`;
  }

  /**
   * Encrypts a value using Web Crypto API with AES-GCM and computes HMAC
   * using the provided salt, IV, encryption key, and HMAC key.
   * Returns an object containing the raw encrypted payload string and
   * an object containing the individual components (salt, IV, ciphertext, HMAC)
   * @param value The plaintext string to encrypt
   * @param salt The base64 encoded salt value
   * @param iv The initialization vector as Uint8Array
   * @param encryptionKey The CryptoKey for encryption
   * @param hmacKey The CryptoKey for HMAC computation
   * @returns An object containing the raw encrypted payload string and the individual components
   */
  public static async createEncryptedPayload(
    value: string,
    salt: string,
    iv: Uint8Array,
    encryptionKey: crypto.webcrypto.CryptoKey,
    hmacKey: crypto.webcrypto.CryptoKey,
  ): Promise<{
    raw: string;
    components: { salt: string; iv: string; cipherText: string; hmac: string };
  }> {
    // Encrypt the value
    const encryptedBuffer = await CryptoWebOperations.encryptBuffer(iv, encryptionKey, value);
    const cipherText = Buffer.from(encryptedBuffer).toString(FileEncoding.BASE64);
    const ivBase64 = Buffer.from(iv).toString(FileEncoding.BASE64);

    // Compute HMAC using consolidated method
    const dataToHmac = CryptoHmac.prepareHMACData(salt, ivBase64, cipherText);
    const hmacBase64 = await CryptoWebOperations.computeHMAC(hmacKey, dataToHmac);

    const formatted = this.formatEncryptedPayload(salt, ivBase64, cipherText, hmacBase64);
    return {
      raw: formatted,
      components: { salt, iv: ivBase64, cipherText, hmac: hmacBase64 },
    };
  }
}
