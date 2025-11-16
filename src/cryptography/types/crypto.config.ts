/**
 * Type definitions for crypto configuration, formats, algorithms, and validation rules.
 */
import type {
  CryptoConfig,
  EncryptionFormat,
  CryptoAlgorithm,
  CryptoValidation,
} from "./crypto.types.js";

/**
 * Supported output formats for encoded data (Base64, Hex, Buffer).
 */
export const OUTPUT_FORMAT = {
  BASE64: "base64",
  HEX: "hex",
  BUFFER: "buffer",
} as const;

/**
 * Identifiers used for generating or validating different crypto elements,
 * such as salts, secret keys, IVs, and random values.
 */
export const CRYPTO_TYPE = {
  SALT: "salt",
  SECRET_KEY: "secretKey",
  IV: "iv",
  RANDOM: "random",
} as const;

/**
 * Core cryptographic configuration including byte lengths, Argon2 parameters,
 * and validation limits for secure operation.
 */
export const CRYPTO_CONFIG: CryptoConfig = {
  BYTE_LENGTHS: {
    IV: 16,
    WEB_CRYPTO_IV: 12,
    SALT: 32,
    SECRET_KEY: 32,
    HMAC_KEY_LENGTH: 32,
  },
  ARGON2_PARAMETERS: {
    MEMORY_COST: 262144, // 256 MB
    TIME_COST: 4,
    PARALLELISM: 3,
  },
  VALIDATION_LIMITS: {
    MAX_REASONABLE_LENGTH: 4096,
    MIN_SECURE_LENGTH: 8,
  },
};

/**
 * Constants defining encryption format metadata, algorithm choices,
 * and validation patterns used across the crypto module.
 */
export const CRYPTO_CONSTANTS = {
  FORMAT: {
    PREFIX: "ENC2:",
    VERSION: "v1",
    SEPARATOR: ":",
    EXPECTED_PARTS: 5,
    PREFIX_LENGTH: 5,
  } as EncryptionFormat,
  ALGORITHM: {
    CIPHER: "AES-GCM",
    KEY_USAGE: ["encrypt", "decrypt"] as KeyUsage[],
  } as CryptoAlgorithm,
  VALIDATION: {
    ENV_VAR_KEY_PATTERN: /^[A-Z_][A-Z0-9_]*$/i,
  } as CryptoValidation,
} as const;
