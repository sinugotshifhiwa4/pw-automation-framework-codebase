import ErrorHandler from "../../../../utils/errorHandling/errorHandler.js";

export default class InputValidator {
  /**
   * Validates that the given input value is not empty.
   * Throws an error if the value is empty after trimming.
   * @param value - The input value to validate.
   * @param method - The name of the calling method for logging context.
   */
  public static validateNotEmpty(value: string, method: string): void {
    if (!value?.trim()) {
      ErrorHandler.logAndThrow(method, "Input value cannot be empty");
    }
  }
}
