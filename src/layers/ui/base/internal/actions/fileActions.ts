import type { Page, Locator, Download } from "@playwright/test";
import { ActionBase } from "./actionBase.js";
import { AsyncFileManager } from "../../../../../utils/fileManager/asyncFileManager.js";
import fs from "fs";
import { ElementActions } from "./elementActions.js";
import type { FileUploadMethod } from "../types/actions.type.js";
import ErrorHandler from "../../../../../utils/errorHandling/errorHandler.js";

export class FileActions extends ActionBase {
  private ElementActions: ElementActions;

  constructor(page: Page, elementActions: ElementActions) {
    super(page);
    this.ElementActions = elementActions;
  }

  /**
   * Upload a file to the page.
   *
   * @param element Element to interact with for uploading the file.
   * @param callerMethodName Name of the method that called this function.
   * @param filePath Path to save the file to.
   * @param uploadMethod Method to use for uploading the file: 'fileChooser' or 'inputFiles'.
   * @param elementName Name of the element (optional).
   * @returns Promise that resolves with the result of the upload action if it succeeds, or rejects with the error if it fails.
   */
  async uploadFile(
    element: Locator,
    callerMethodName: string,
    filePath: string,
    uploadMethod: FileUploadMethod,
    elementName?: string,
  ) {
    return this.performAction(
      async () => {
        if (uploadMethod === "fileChooser") {
          // Wait for fileChooser to be triggered
          const [fileChooser] = await Promise.all([
            this.page.waitForEvent("filechooser"),
            this.ElementActions.clickElement(element, callerMethodName, elementName),
          ]);
          await fileChooser.setFiles(filePath);
        } else {
          await element.setInputFiles(filePath);
        }
      },
      callerMethodName,
      `File '${elementName}' uploaded successfully via '${uploadMethod}' on path: ${filePath}`,
      `Failed to upload file via ${uploadMethod}`,
    );
  }

  /**
   * Handle a file download.
   *
   * @param callerMethodName Name of the method that called this function.
   * @param triggerAction A function that triggers the download.
   * @param downloadPath Path to save the downloaded file to (optional).
   * @returns A promise that resolves with the downloaded file if it succeeds, or rejects with the error if it fails.
   */
  async handleDownload(
    callerMethodName: string,
    triggerAction: () => Promise<void>,
    downloadPath?: string,
  ): Promise<Download> {
    return this.performAction(
      async () => {
        const [download] = await Promise.all([this.page.waitForEvent("download"), triggerAction()]);

        if (downloadPath) {
          await download.saveAs(downloadPath);
        }

        return download;
      },
      callerMethodName,
      `File download handled${downloadPath ? ` and saved to: ${downloadPath}` : ""}`,
      "Failed to handle file download",
    );
  }

  /**
   * Verifies that a file has been downloaded to the specified path.
   *
   * @param callerMethodName Name of the method that called this function.
   * @param filePath Path to the file to verify.
   * @returns A promise that resolves if the verification succeeds, or rejects with the error if it fails.
   * @example
   * await verifyFileDownloaded("verifyFileDownloaded", "path/to/file");
   */
  async verifyFileDownloaded(callerMethodName: string, filePath: string): Promise<void> {
    return this.performAction(
      async () => {
        const result = await AsyncFileManager.checkAccess(filePath, fs.constants.F_OK);

        if (!result) {
          ErrorHandler.logAndThrow("assertFileDownloaded", `File not found at path: ${filePath}`);
        }
      },
      callerMethodName,
      `File successfully downloaded to: ${filePath}`,
      `File verification failed for: ${filePath}`,
    );
  }
}
