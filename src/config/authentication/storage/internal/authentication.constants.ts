/**
 * Configuration object for authentication-related paths and settings
 */
export const AUTH_FILE_CONFIG = {
  ROOT_DIRECTORY: ".auth",
  CI_AUTH_FILE: "ci-login.json",
  LOCAL_AUTH_FILE: "local-login.json",
  EMPTY_AUTH_STATE: "{}",
  SHARD_INDEX_FILE: `ci-login-shard-`,
} as const;
