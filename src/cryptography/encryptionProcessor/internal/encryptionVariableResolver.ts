import StagesFileManager from "../../../config/environment/manager/stagesFileManager.js";
import EncryptionUtils from "./encryptionUtils.js";
import type { VariableResolutionResult } from "../../types/environmentFileEncryptor.type.js";
import logger from "../../../config/logger/loggerManager.js";

export class EncryptionVariableResolver {
  /**
   * Resolves the variables to encrypt from the given set of variables.
   * If targetVariables is provided, only the variables in the targetVariables list will be considered for encryption.
   * Otherwise, all variables will be considered for encryption.
   * The resolved variables will be categorized into three groups: toEncrypt, alreadyEncrypted, and emptyValues.
   * @param allVariables - Object containing all environment variables
   * @param targetVariables - Optional list of variable names to encrypt
   * @returns VariableResolutionResult containing the variables to encrypt, already encrypted variables, empty values, and not found variables
   */
  public resolveEncryptableVariables(
    allVariables: Record<string, string>,
    targetVariables?: string[],
  ): VariableResolutionResult {
    const candidates = this.selectCandidateVariables(allVariables, targetVariables);
    return this.categorizeVariables(candidates.variables, candidates.notFound);
  }

  /**
   * Selects the variables to encrypt from the given set of variables.
   * If targetVariables is provided, only the variables in the targetVariables list will be considered for encryption.
   * Otherwise, all variables will be considered for encryption.
   * The resolved variables will be categorized into two groups: variables and notFound.
   * @param allVariables - Object containing all environment variables
   * @param targetVariables - Optional list of variable names to encrypt
   * @returns Object containing variables to encrypt and not found variables
   */
  private selectCandidateVariables(
    allVariables: Record<string, string>,
    targetVariables?: string[],
  ): { variables: Record<string, string>; notFound: string[] } {
    if (!targetVariables?.length) {
      return { variables: { ...allVariables }, notFound: [] };
    }

    return this.filterRequestedVariables(allVariables, targetVariables);
  }

  /**
   * Filters the given set of variables based on the target variables list.
   * The resolved variables will be categorized into two groups: variables and notFound.
   * The variables group will contain the variables that were found in the allVariables object,
   * while the notFound group will contain the variables that were not found.
   * @param allVariables - Object containing all environment variables
   * @param targetVariables - List of variable names to filter
   * @returns Object containing variables and not found variables
   */
  private filterRequestedVariables(
    allVariables: Record<string, string>,
    targetVariables: string[],
  ): { variables: Record<string, string>; notFound: string[] } {
    const variables: Record<string, string> = {};
    const notFound: string[] = [];

    for (const rawKey of targetVariables) {
      const key = EncryptionUtils.trimSafely(rawKey);
      if (!key) continue;

      const value = StagesFileManager.findEnvironmentVariableByKey(allVariables, key);

      if (value === undefined) {
        notFound.push(key);
      } else {
        variables[key] = value;
      }
    }

    if (notFound.length > 0) {
      logger.warn(`Environment variables not found: ${notFound.join(", ")}`);
    }

    return { variables, notFound };
  }

  /**
   * Categorizes the variables from the candidates object into three groups: toEncrypt, alreadyEncrypted, and emptyValues.
   * The toEncrypt group will contain the variables that need to be encrypted,
   * the alreadyEncrypted group will contain the variables that are already encrypted,
   * and the emptyValues group will contain the variables with empty values.
   * The notFound variables are returned as part of the result object.
   * The function also logs the categorization results.
   * @param candidates - Object containing the variables to categorize
   * @param notFound - Array of variable names that were not found
   * @returns Object containing the categorized variables and not found variables
   */
  private categorizeVariables(
    candidates: Record<string, string>,
    notFound: string[],
  ): VariableResolutionResult {
    const toEncrypt: Record<string, string> = {};
    const alreadyEncrypted: string[] = [];
    const emptyValues: string[] = [];

    for (const [key, value] of Object.entries(candidates)) {
      const trimmedValue = EncryptionUtils.trimSafely(value);

      if (!trimmedValue) {
        emptyValues.push(key);
        continue;
      }

      if (EncryptionUtils.isAlreadyEncrypted(trimmedValue)) {
        alreadyEncrypted.push(key);
        continue;
      }

      toEncrypt[key] = value;
    }

    this.logCategorizationResults(toEncrypt, alreadyEncrypted, emptyValues);

    return { toEncrypt, alreadyEncrypted, emptyValues, notFound };
  }

  /**
   * Logs the categorization results of the given variables.
   * The function logs the variables that are already encrypted, have empty values, and are ready for encryption.
   * @param toEncrypt - Object containing the variables to encrypt
   * @param alreadyEncrypted - Array of variable names that are already encrypted
   * @param emptyValues - Array of variable names with empty values
   */
  private logCategorizationResults(
    toEncrypt: Record<string, string>,
    alreadyEncrypted: string[],
    emptyValues: string[],
  ): void {
    EncryptionUtils.logIfNotEmpty(alreadyEncrypted, (vars) =>
      logger.info(`Variables already encrypted — skipping: ${vars.join(", ")}`),
    );

    EncryptionUtils.logIfNotEmpty(emptyValues, (vars) =>
      logger.warn(`Variables with empty values — skipping: ${vars.join(", ")}`),
    );

    EncryptionUtils.logIfNotEmpty(Object.keys(toEncrypt), (vars) =>
      logger.info(`Variables ready for encryption: ${vars.join(", ")}`),
    );
  }
}
