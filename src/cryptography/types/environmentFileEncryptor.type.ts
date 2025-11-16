export interface EncryptionExecutionResult {
  updatedLines: string[];
  encryptedCount: number;
}

export interface VariableResolutionResult {
  toEncrypt: Record<string, string>;
  alreadyEncrypted: string[];
  emptyValues: string[];
  notFound: string[];
}
