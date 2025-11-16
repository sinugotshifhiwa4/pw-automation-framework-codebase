import CryptoEngineFacade from "../engine/cryptoEngineFacade.js";
import ErrorHandler from "../../utils/errorHandling/errorHandler.js";

export class CryptoService {
  /**
   * Encrypts a value using Web Crypto API with AES-GCM and computes HMAC
   * Validates the prerequisites for encryption and generates the encryption components
   * Returns the formatted encrypted payload string
   * @param value The plaintext string to encrypt
   * @param secretKeyVariable The secret key variable to use for encryption
   * @returns The formatted encrypted payload string
   */
  public static async encrypt(value: string, secretKeyVariable: string): Promise<string> {
    try {
      // Validate prerequisites
      const secretKey = await CryptoEngineFacade.Encryption.validateEncryptionPrerequisites(
        value,
        secretKeyVariable,
      );

      // Generate encryption components (returns Web Crypto types)
      const { salt, iv, encryptionKey, hmacKey } =
        await CryptoEngineFacade.Encryption.generateEncryptionComponents(secretKey);

      // Create encrypted payload using Web Crypto API
      const { raw } = await CryptoEngineFacade.Encryption.createEncryptedPayload(
        value,
        salt,
        iv,
        encryptionKey,
        hmacKey,
      );

      // Return only the formatted string (for env storage, CLI output, etc.)
      return raw;
    } catch (error) {
      ErrorHandler.captureError(error, "encrypt", "Failed to encrypt with AES-GCM.");
      throw error;
    }
  }

  /**
   * Encrypts multiple values in parallel
   */
  public static async encryptMultiple(
    values: string[],
    secretKeyVariable: string,
  ): Promise<string[]> {
    return Promise.all(values.map((value) => this.encrypt(value, secretKeyVariable)));
  }

  /**
   * Main decrypt method using Web Crypto API throughout
   * All key handling is now consistent with Web Crypto standards
   */
  public static async decrypt(encryptedData: string, secretKeyVariable: string): Promise<string> {
    const resolvedSecretKey =
      await CryptoEngineFacade.Environment.getSecretKeyFromEnvironment(secretKeyVariable);
    CryptoEngineFacade.Validation.validateSecretKey(resolvedSecretKey);
    CryptoEngineFacade.Validation.validateInputs(encryptedData, resolvedSecretKey, "decrypt");

    try {
      // Parse and validate encrypted data format
      const { salt, iv, cipherText, receivedHmac } =
        CryptoEngineFacade.Decryption.parseEncryptedData(encryptedData);

      // Derive keys using Argon2 (returns Web Crypto CryptoKey objects)
      const { encryptionKey, hmacKey } = await CryptoEngineFacade.Argon2.deriveKeysWithArgon2(
        resolvedSecretKey,
        salt,
      );

      // Verify HMAC integrity
      await CryptoEngineFacade.HMAC.verifyHMACIntegrity(
        salt,
        iv,
        cipherText,
        receivedHmac,
        hmacKey,
      );

      // Perform decryption using Web Crypto API
      const decryptedBuffer = await CryptoEngineFacade.Decryption.performDecryption(
        iv,
        encryptionKey,
        cipherText,
      );

      // Decode the decrypted buffer to string
      return new TextDecoder().decode(new Uint8Array(decryptedBuffer));
    } catch (error) {
      ErrorHandler.captureError(error, "decrypt", "Failed to decrypt with AES-GCM.");
      throw error;
    }
  }

  /**
   * Decrypts multiple values in parallel
   */
  public static async decryptMultiple(
    encryptedValues: string[],
    secretKeyVariable: string,
  ): Promise<string[]> {
    if (!Array.isArray(encryptedValues)) {
      ErrorHandler.logAndThrow("decryptMultiple", "encryptedValues must be an array");
    }

    if (encryptedValues.length === 0) {
      return [];
    }

    try {
      return await Promise.all(
        encryptedValues.map((data) => this.decrypt(data, secretKeyVariable)),
      );
    } catch (error) {
      ErrorHandler.captureError(
        error,
        "decryptMultiple",
        "Failed to decrypt multiple values with AES-GCM.",
      );
      throw error;
    }
  }
}
