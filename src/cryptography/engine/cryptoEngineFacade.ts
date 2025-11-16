import CryptoValidation from "./internal/cryptoValidation.js";
import CryptoEnvironment from "./internal/cryptoEnvironment.js";
import CryptoWebOperations from "./internal/cryptoWebOperations.js";
import CryptoArgon2 from "./internal/cryptoArgon2.js";
import CryptoHmac from "./internal/cryptoHmac.js";
import CryptoEncryption from "./internal/cryptoEncryption.js";
import CryptoDecryption from "./internal/cryptoDecryption.js";

/**
 * Facade class providing unified access to cryptographic engine functionalities.
 * Combines validation, environment handling, web operations, Argon2 key derivation,
 * HMAC operations, encryption, and decryption into a single interface.
 */
export default class CryptoEngineFacade {
  static Validation = CryptoValidation;
  static Environment = CryptoEnvironment;
  static Web = CryptoWebOperations;
  static Argon2 = CryptoArgon2;
  static HMAC = CryptoHmac;
  static Encryption = CryptoEncryption;
  static Decryption = CryptoDecryption;
}
